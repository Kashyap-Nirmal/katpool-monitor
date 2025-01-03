import express from 'express';
import fs from 'fs';
import path from 'path';
import { getBalances, getTotals, getPaymentsByWallet } from './db'; // Import the new function
import { getCurrentPoolHashRate } from './prom';

const app = express();
const port = 9301;

// Existing API endpoints
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

// app.get('/api/miningPoolStats', async (req, res) => {
//   try {
//     const coinMined = "Kaspa";
//     const poolName = "Kat Pool";
//     const poolUrl = "https://kas.katpool.xyz";
//     const poolHashRate = await getCurrentPoolHashRate();
//     const poolLevelData = {
//       coinMined,
//       poolName,
//       poolUrl,
//       poolHashRate,
//     } // TODO : recentBlocks
//     res.status(200).send(poolLevelData)
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error retrieving mining pool stats')
//   }
// })

// New API endpoint to retrieve payments by wallet_address
app.get('/api/payments/:wallet_address', async (req, res) => {
  const walletAddress = req.params.wallet_address;
  try {
    const payments = await getPaymentsByWallet(walletAddress); // Use the function from db.ts
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving payments');
  }
});

// Start the server
export function startServer() {
  app.listen(port, () => {
    console.log(`API Server running at http://localhost:${port}`);
  });
}
