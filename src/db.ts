import { Pool } from 'pg';
import { Decimal } from 'decimal.js';
import dotenv from 'dotenv';

dotenv.config();

// Check if DATABASE_URL is configured
if (!process.env.DATABASE_URL) {
  console.error("DB: Error - DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log(`DB: Connecting DB`);

export async function getBalances() {
  const client = await pool.connect();
  console.log(`DB: getting balances`);
  try {
    const res = await client.query('SELECT miner_id, wallet, balance FROM miners_balance');
    const balances: Record<string, Record<string, Decimal>> = {};

    res.rows.forEach(row => {
      const wallet = row.wallet;
      const miner_id = row.miner_id;
      const balance = new Decimal(row.balance);
      if (!balances[wallet]) {
        balances[wallet] = {};
      }
      balances[wallet][miner_id] = balance;
    });

    return balances;
  } finally {
    client.release();
  }
}

export async function getBlockDetails() {
  const client = await pool.connect();
  console.log(`DB: getting block details`);
  try {
    const res = await client.query('SELECT block_hash, miner_id, pool_address, wallet, daa_score, timestamp FROM block_details');
    console.log("Res.rows ", res.rows)
    return res.rows;
  } finally {
    client.release();
  }
}

export async function getTotals() {
  const client = await pool.connect();
  console.log(`DB: getting totals`);
  try {
    const res = await client.query('SELECT address, total FROM wallet_total');
    const totals: Record<string, Decimal> = {};

    res.rows.forEach(row => {
      const address = row.address;
      const total = new Decimal(row.total);
      totals[address] = total;
    });

    return totals;
  } finally {
    client.release();
  }
}

export async function getPayments() {
  const client = await pool.connect();
  try{
    const res = await client.query('SELECT wallet_address, amount, timestamp, transaction_hash FROM payments ORDER BY timestamp DESC LIMIT 500');
    return res.rows
  } finally {
    client.release()
  }
}

// New function to retrieve payments by wallet_address
export async function getPaymentsByWallet(walletAddress: string) {
  const client = await pool.connect();
  console.log(`DB: getting payments for wallet_address: ${walletAddress}`);
  try {
    const res = await client.query('SELECT * FROM payments WHERE $1 = ANY(wallet_address) ORDER BY timestamp DESC', [walletAddress]);
    return res.rows;
  } finally {
    client.release();
  }
}
