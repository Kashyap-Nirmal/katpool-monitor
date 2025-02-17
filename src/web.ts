import express from 'express';
import fs from 'fs';
import path from 'path';
import { getBalances, getTotals, getPaymentsByWallet, getPayments, getBlockDetails } from './db'; // Import the new function
import { getCurrentPoolHashRate, getBlocks, getLastBlockDetails } from './prom';
import *  as constants from './constants';

const app = express();
const port = 9301;

// Existing API endpoints
app.get('/balance', async (req, res) => {
  const balances = await getBalances('balance');
  res.json({ balance: balances });
});

app.get('/nacho_balance', async (req, res) => {
  const balances = await getBalances('nacho_rebate_kas');
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

app.get('/api/miningPoolStats', async (req, res) => {
  try {
    const configPath = path.resolve('./config/received_config.json');
    let poolFee, url, advertise_image, minPay, blocks, lastBlockDetails, lastblock, lastblocktime;
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf-8');
      const configJson = JSON.parse(configData)
      poolFee = configJson?.treasury?.fee;
      url = configJson?.hostname;
      advertise_image = configJson?.advertise_image_link;
      minPay = configJson?.thresholdAmount! / constants.KAStoSompi;
    }

    const current_hashRate = await getCurrentPoolHashRate();
    blocks = await getBlocks();
    lastBlockDetails = await getLastBlockDetails()

    if (lastBlockDetails) {
      lastblock = lastBlockDetails.lastblock
      lastblocktime = lastBlockDetails.lastblocktime
    }
    url = url || constants.pool_url;
    poolFee = poolFee || constants.pool_fee;
    advertise_image = advertise_image || constants.advertise_image_link; 

    const poolLevelData = {
      coin_mined : constants.coin_mined,
      pool_name : constants.pool_name,
      url,
      poolFee,
      current_hashRate,
      blocks,
      advertise_image_link : constants.advertise_image_link,
      minPay,
      country : constants.country,
      feeType : constants.feeType,
      lastblock,
      lastblocktime
    } 
    res.status(200).send(poolLevelData)
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving mining pool stats')
  }
})

app.get('/api/pool/payouts', async (req, res) => {
  try{
    const payments = await getPayments('payments');
    res.status(200).json(payments)
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving payments')
  }
})

// New API endpoint to retrieve payments by wallet_address
app.get('/api/payments/:wallet_address', async (req, res) => {
  const walletAddress = req.params.wallet_address;
  try {
    const payments = await getPaymentsByWallet(walletAddress, 'payments'); // Use the function from db.ts
    res.status(200).json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving payments');
  }
});

app.get('/api/pool/nacho_payouts', async (req, res) => {
  try{
    const payments = await getPayments('nacho_payments');
    res.status(200).json(payments)
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving payments')
  }
})

// New API endpoint to retrieve payments by wallet_address
app.get('/api/nacho_payments/:wallet_address', async (req, res) => {
  const walletAddress = req.params.wallet_address;
  try {
    const payments = await getPaymentsByWallet(walletAddress, 'nacho_payments'); // Use the function from db.ts
    res.status(200).json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving payments');
  }
});

app.get('/api/blockdetails', async (req, res) => {
  try{
    const blockdetails = await getBlockDetails();
    res.status(200).json(blockdetails)
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving blockdetails')
  }
})

// Start the server
export function startServer() {
  app.listen(port, () => {
    console.log(`API Server running at http://localhost:${port}`);
  });
}
