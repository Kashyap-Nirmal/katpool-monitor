import express from 'express';
import client from 'prom-client';
import { getBalances, getTotals } from './db';

const register = new client.Registry();

const balanceGauge = new client.Gauge({
  name: 'miner_balances',
  help: 'Balances of miners',
  labelNames: ['miner_id', 'wallet'],
});

const totalGauge = new client.Gauge({
  name: 'wallet_totals',
  help: 'Total balances of wallets',
  labelNames: ['wallet'],
});

register.registerMetric(balanceGauge);
register.registerMetric(totalGauge);

export async function updateMetrics() {
  console.log(`Metrics: enteringupdateMetrics function`);
  const balances = await getBalances();
  for (const wallet in balances) {
    for (const miner_id in balances[wallet]) {
      balanceGauge.set({ miner_id, wallet }, balances[wallet][miner_id].toNumber());
    }
  }

  const totals = await getTotals();
  for (const wallet in totals) {
    totalGauge.set({ wallet }, totals[wallet].toNumber());
  }
}

export function startMetricsServer() {
  const app = express();
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  app.listen(9300, () => {
    console.log('Metrics server running at http://localhost:9300');
  });
}
