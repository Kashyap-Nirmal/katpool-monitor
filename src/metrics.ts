import express from 'express';
import client from 'prom-client';
import { getBalances, getTotals } from './db';
import Decimal from 'decimal.js'; // Import Decimal from decimal.js

const register = new client.Registry();

const balanceGauge = new client.Gauge({
  name: 'miner_balances',
  help: 'Balances of miners by wallet',
  labelNames: ['wallet'],
});

const totalGauge = new client.Gauge({
  name: 'wallet_totals',
  help: 'Total balances of wallets',
  labelNames: ['wallet'],
});

register.registerMetric(balanceGauge);
register.registerMetric(totalGauge);

export async function updateMetrics() {
  console.log(`Metrics: entering updateMetrics function`);

  const balances = await getBalances('balance');
  const aggregatedBalances: Record<string, Decimal> = {};

  for (const wallet in balances) {
    let walletTotal = new Decimal(0);
    for (const miner_id in balances[wallet]) {
      walletTotal = walletTotal.plus(balances[wallet][miner_id]);
    }
    aggregatedBalances[wallet] = walletTotal;
  }

  for (const wallet in aggregatedBalances) {
    balanceGauge.set({ wallet }, aggregatedBalances[wallet].toNumber());
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
