import express from 'express';
import fs from 'fs';
import path from 'path';
import { getBalances, getTotals } from './db';
import { register, balanceGauge } from './metrics';  // Import register and balanceGauge

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

// New Endpoint: Fetch Current Miner Balances via Prometheus
app.get('/api/miner_balances', async (req, res) => {
  try {
    // Fetch the current values of the miner_balances gauge
    const metrics = await register.getMetricsAsJSON();
    const minerBalancesMetric = metrics.find(
      (metric: any) => metric.name === 'miner_balances'
    );

    if (minerBalancesMetric && minerBalancesMetric.values) {
      // Extracting the wallet and value pairs
      const balances = minerBalancesMetric.values.map((value: any) => ({
        wallet: value.labels.wallet,
        balance: value.value,
      }));

      res.status(200).json(balances);
    } else {
      res.status(404).send('miner_balances metric not found.');
    }
  } catch (error) {
    res.status(500).send(`Error fetching miner_balances: ${error.message}`);
  }
});

export function startServer() {
  app.listen(port, () => {
    console.log(`API Server running at http://localhost:${port}`);
  });
}
