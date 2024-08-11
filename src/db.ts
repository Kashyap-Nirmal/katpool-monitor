import { Client } from 'pg';
import { Decimal } from 'decimal.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

console.log(`DB: Connecting DB`);
client.connect();

export async function getBalances() {
  console.log(`DB: getting balances`);
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
}

export async function getTotals() {
  console.log(`DB: getting totals`);
  const res = await client.query('SELECT address, total FROM wallet_total');
  const totals: Record<string, Decimal> = {};

  res.rows.forEach(row => {
    const address = row.address;
    const total = new Decimal(row.total);
    totals[address] = total;
  });

  return totals;
}

// New function to retrieve payments by wallet_address
export async function getPaymentsByWallet(walletAddress: string) {
  console.log(`DB: getting payments for wallet_address: ${walletAddress}`);
  const res = await client.query('SELECT * FROM payments WHERE wallet_address = $1 ORDER BY timestamp DESC', [walletAddress]);
  return res.rows;
}
