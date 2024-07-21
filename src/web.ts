import express from 'express';
import { getBalances, getTotals } from './db';

const app = express();
const port = 9301;

app.get('/balance', async (req, res) => {
  const balances = await getBalances();
  res.json({ balance: balances });
});

app.get('/total', async (req, res) => {
  const totals = await getTotals();
  res.json({ total: totals });
});

export function startServer() {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}
