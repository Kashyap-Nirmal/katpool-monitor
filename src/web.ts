import express from 'express';
import fs from 'fs';
import path from 'path';
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

app.get('/config', (req, res) => {
  const configPath = path.resolve('./config/received_config.json');
  if (fs.existsSync(configPath)) {
    const configData = fs.readFileSync(configPath, 'utf-8');
    res.status(200).json(JSON.parse(configData));
  } else {
    res.status(404).send('Config file not found.');
  }
});

export function startServer() {
  app.listen(port, () => {
    console.log(`API Server running at http://localhost:${port}`);
  });
}
