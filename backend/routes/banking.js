const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

/**
 * Helper: Insert into Audit_Log
 */
async function logAudit(client, transactionId, action, remarks) {
  await client.query(
    `INSERT INTO Audit_Log (transaction_id, action, timestamp, remarks)
     VALUES ($1, $2, NOW(), $3)`,
    [transactionId, action, remarks]
  );
}

/**
 * Helper: Verify account belongs to customer (for customer role)
 */
async function verifyAccountOwnership(client, accountId, user) {
  if (user.role === 'admin') return true;
  const result = await client.query(
    `SELECT customer_id FROM Account WHERE account_id = $1`,
    [accountId]
  );
  if (result.rows.length === 0) return false;
  return result.rows[0].customer_id === user.customer_id;
}

/**
 * POST /api/deposit
 * Deposit funds into an account
 */
router.post('/deposit', authenticateToken, async (req, res) => {
  const { account_id, amount } = req.body;

  if (!account_id || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid account_id and positive amount required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify ownership
    const owned = await verifyAccountOwnership(client, account_id, req.user);
    if (!owned) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Account does not belong to you.' });
    }

    // Check account is active
    const accResult = await client.query(
      `SELECT * FROM Account WHERE account_id = $1 AND status = 'active'`,
      [account_id]
    );
    if (accResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Account not found or inactive.' });
    }

    // Update balance
    const updateResult = await client.query(
      `UPDATE Account SET balance = balance + $1
       WHERE account_id = $2 RETURNING balance`,
      [amount, account_id]
    );
    const newBalance = updateResult.rows[0].balance;

    // Insert transaction record
    const txResult = await client.query(
      `INSERT INTO Transactions (account_id, transaction_type, amount, transaction_time, status)
       VALUES ($1, 'deposit', $2, NOW(), 'success') RETURNING transaction_id`,
      [account_id, amount]
    );
    const transactionId = txResult.rows[0].transaction_id;

    // Audit log
    await logAudit(client, transactionId, 'DEPOSIT',
      `Deposited ₹${parseFloat(amount).toFixed(2)} into account #${account_id}. New balance: ₹${newBalance}`
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Successfully deposited ₹${parseFloat(amount).toFixed(2)}`,
      transaction_id: transactionId,
      new_balance: newBalance,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Deposit error:', err);
    res.status(500).json({ error: 'Deposit failed. Please try again.' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/withdraw
 * Withdraw funds from an account
 */
router.post('/withdraw', authenticateToken, async (req, res) => {
  const { account_id, amount } = req.body;

  if (!account_id || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid account_id and positive amount required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify ownership
    const owned = await verifyAccountOwnership(client, account_id, req.user);
    if (!owned) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Account does not belong to you.' });
    }

    // Check account and get current balance (with FOR UPDATE lock)
    const accResult = await client.query(
      `SELECT a.*, at.minimum_balance
       FROM Account a
       JOIN Account_Type at ON a.account_type_id = at.account_type_id
       WHERE a.account_id = $1 AND a.status = 'active'
       FOR UPDATE`,
      [account_id]
    );
    if (accResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Account not found or inactive.' });
    }

    const account = accResult.rows[0];
    const afterWithdrawal = parseFloat(account.balance) - parseFloat(amount);

    // Check minimum balance requirement
    if (afterWithdrawal < parseFloat(account.minimum_balance)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Insufficient balance. Minimum balance requirement is ₹${account.minimum_balance}. Available: ₹${(account.balance - account.minimum_balance).toFixed(2)}`
      });
    }

    // Update balance
    const updateResult = await client.query(
      `UPDATE Account SET balance = balance - $1
       WHERE account_id = $2 RETURNING balance`,
      [amount, account_id]
    );
    const newBalance = updateResult.rows[0].balance;

    // Insert transaction record
    const txResult = await client.query(
      `INSERT INTO Transactions (account_id, transaction_type, amount, transaction_time, status)
       VALUES ($1, 'withdrawal', $2, NOW(), 'success') RETURNING transaction_id`,
      [account_id, amount]
    );
    const transactionId = txResult.rows[0].transaction_id;

    // Audit log
    await logAudit(client, transactionId, 'WITHDRAWAL',
      `Withdrew ₹${parseFloat(amount).toFixed(2)} from account #${account_id}. New balance: ₹${newBalance}`
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Successfully withdrew ₹${parseFloat(amount).toFixed(2)}`,
      transaction_id: transactionId,
      new_balance: newBalance,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Withdrawal error:', err);
    res.status(500).json({ error: 'Withdrawal failed. Please try again.' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/transfer
 * Transfer funds between accounts
 */
router.post('/transfer', authenticateToken, async (req, res) => {
  const { from_account_id, to_account_id, amount } = req.body;

  if (!from_account_id || !to_account_id || !amount || amount <= 0) {
    return res.status(400).json({ error: 'from_account_id, to_account_id, and positive amount required.' });
  }

  if (from_account_id === to_account_id) {
    return res.status(400).json({ error: 'Cannot transfer to the same account.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify sender account ownership
    const owned = await verifyAccountOwnership(client, from_account_id, req.user);
    if (!owned) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Source account does not belong to you.' });
    }

    // Lock both accounts in consistent order to prevent deadlock
    const minId = Math.min(from_account_id, to_account_id);
    const maxId = Math.max(from_account_id, to_account_id);

    await client.query(
      `SELECT account_id FROM Account WHERE account_id IN ($1, $2) FOR UPDATE`,
      [minId, maxId]
    );

    // Get sender account with minimum balance
    const senderResult = await client.query(
      `SELECT a.*, at.minimum_balance
       FROM Account a
       JOIN Account_Type at ON a.account_type_id = at.account_type_id
       WHERE a.account_id = $1 AND a.status = 'active'`,
      [from_account_id]
    );
    if (senderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Source account not found or inactive.' });
    }

    // Get receiver account
    const receiverResult = await client.query(
      `SELECT * FROM Account WHERE account_id = $1 AND status = 'active'`,
      [to_account_id]
    );
    if (receiverResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Destination account not found or inactive.' });
    }

    const sender = senderResult.rows[0];
    const afterDebit = parseFloat(sender.balance) - parseFloat(amount);

    // Check sufficient balance
    if (afterDebit < parseFloat(sender.minimum_balance)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Insufficient balance for transfer. Available: ₹${(sender.balance - sender.minimum_balance).toFixed(2)}`
      });
    }

    // Deduct from sender
    const senderUpdate = await client.query(
      `UPDATE Account SET balance = balance - $1 WHERE account_id = $2 RETURNING balance`,
      [amount, from_account_id]
    );

    // Add to receiver
    const receiverUpdate = await client.query(
      `UPDATE Account SET balance = balance + $1 WHERE account_id = $2 RETURNING balance`,
      [amount, to_account_id]
    );

    const senderNewBalance = senderUpdate.rows[0].balance;
    const receiverNewBalance = receiverUpdate.rows[0].balance;

    // Insert debit transaction
    const debitTx = await client.query(
      `INSERT INTO Transactions (account_id, transaction_type, amount, transaction_time, status)
       VALUES ($1, 'transfer_debit', $2, NOW(), 'success') RETURNING transaction_id`,
      [from_account_id, amount]
    );

    // Insert credit transaction
    const creditTx = await client.query(
      `INSERT INTO Transactions (account_id, transaction_type, amount, transaction_time, status)
       VALUES ($1, 'transfer_credit', $2, NOW(), 'success') RETURNING transaction_id`,
      [to_account_id, amount]
    );

    const debitTxId = debitTx.rows[0].transaction_id;
    const creditTxId = creditTx.rows[0].transaction_id;

    // Audit logs for both sides
    await logAudit(client, debitTxId, 'TRANSFER_DEBIT',
      `Transfer of ₹${parseFloat(amount).toFixed(2)} sent from account #${from_account_id} to #${to_account_id}. New balance: ₹${senderNewBalance}`
    );
    await logAudit(client, creditTxId, 'TRANSFER_CREDIT',
      `Transfer of ₹${parseFloat(amount).toFixed(2)} received in account #${to_account_id} from #${from_account_id}. New balance: ₹${receiverNewBalance}`
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Successfully transferred ₹${parseFloat(amount).toFixed(2)}`,
      debit_transaction_id: debitTxId,
      credit_transaction_id: creditTxId,
      sender_new_balance: senderNewBalance,
      receiver_new_balance: receiverNewBalance,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transfer error:', err);
    res.status(500).json({ error: 'Transfer failed. Please try again.' });
  } finally {
    client.release();
  }
});

module.exports = router;