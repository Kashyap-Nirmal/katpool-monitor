import { Decimal } from 'decimal.js';
import dotenv from 'dotenv';
import logger from './logger/index';
import { PrismaClient } from '../src/generated/prisma';
import {
  BlockDetail,
  TotalResponse,
  Payment,
  NachoPayment,
  KASPayout48H,
  BalanceByWalletResponse,
  NachoPaymentGrouped,
  BalancesResponse,
} from './types';

dotenv.config();

// Check if DATABASE_URL is configured
if (!process.env.DATABASE_URL) {
  logger.error('DB: Error - DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const prisma = new PrismaClient();
logger.info('DB: Connecting DB');

export async function getBalances(): Promise<BalancesResponse> {
  // logger.info('DB: getting balances');
  try {
    const balances: Record<string, Record<string, Decimal>> = {};
    const miners = await prisma.miners_balance.findMany({
      select: {
        miner_id: true,
        wallet: true,
        balance: true,
      },
    });

    miners.forEach((row: any) => {
      if (row.wallet && row.miner_id) {
        const wallet = row.wallet;
        const miner_id = row.miner_id;
        const balance = new Decimal(row.balance || 0);
        if (!balances[wallet]) {
          balances[wallet] = {};
        }
        balances[wallet][miner_id] = balance;
      }
    });

    return balances;
  } catch (error: any) {
    logger.error('DB: Error getting balances', { error: error.message });
    throw error;
  }
}

export async function getBlockDetails(
  currentPage?: number | null,
  perPage?: number | null
): Promise<BlockDetail[]> {
  logger.info('DB: getting block details');

  try {
    const query = {
      orderBy: {
        timestamp: 'desc' as const,
      },
    };

    if (currentPage != null && perPage != null && currentPage > 0 && perPage > 0) {
      const skip = (currentPage - 1) * perPage;
      Object.assign(query, {
        skip,
        take: perPage,
      });
    }

    const blocks = await prisma.block_details.findMany(query);
    return blocks.map((block) => ({
      mined_block_hash: block.mined_block_hash,
      miner_id: block.miner_id || '',
      pool_address: block.pool_address || '',
      reward_block_hash: block.reward_block_hash || '',
      wallet: block.wallet || '',
      daa_score: Number(block.daa_score || 0),
      miner_reward: Number(block.miner_reward),
      timestamp: block.timestamp || new Date(),
    }));
  } catch (error: any) {
    logger.error('DB: Error getting block details', { error: error.message });
    throw error;
  }
}

export async function getBlockCount(): Promise<number> {
  try {
    const count = await prisma.block_details.count();
    return count;
  } catch (error: any) {
    logger.error('DB: Error getting block count', { error: error.message });
    throw error;
  }
}

export async function getTotals(): Promise<TotalResponse> {
  // logger.info('DB: getting totals');
  try {
    const totals: Record<string, Decimal> = {};
    const walletTotals = await prisma.wallet_total.findMany({
      select: {
        address: true,
        total: true,
      },
    });

    walletTotals.forEach((row) => {
      if (row.address) {
        const address = row.address;
        const total = new Decimal(row.total || 0);
        totals[address] = total;
      }
    });

    return totals;
  } catch (error: any) {
    logger.error('DB: Error getting totals', { error: error.message });
    throw error;
  }
}

export async function getPayments(tableName: string): Promise<Payment[] | NachoPayment[]> {
  try {
    if (tableName === 'payments') {
      const payments = await prisma.payments.findMany({
        select: {
          wallet_address: true,
          amount: true,
          timestamp: true,
          transaction_hash: true,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 500,
      });

      return payments.map((payment) => ({
        wallet_address: payment.wallet_address,
        amount: Number(payment.amount),
        timestamp: payment.timestamp || new Date(),
        transaction_hash: payment.transaction_hash,
      }));
    } else {
      const nachoPayments = await prisma.nacho_payments.findMany({
        select: {
          wallet_address: true,
          nacho_amount: true,
          timestamp: true,
          transaction_hash: true,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 500,
      });

      return nachoPayments.map((payment) => ({
        wallet_address: payment.wallet_address[0] || '',
        nacho_amount: Number(payment.nacho_amount),
        timestamp: payment.timestamp || new Date(),
        transaction_hash: payment.transaction_hash,
      }));
    }
  } catch (error: any) {
    logger.error('DB: Error getting payments', { error: error.message });
    throw error;
  }
}

export async function getPaymentsByWallet(walletAddress: string, tableName: string) {
  logger.info(`DB: getting payments for wallet_address: ${walletAddress}`);
  try {
    if (tableName === 'payments') {
      const payments = await prisma.payments.findMany({
        where: {
          wallet_address: {
            has: walletAddress,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });
      return payments.map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
      }));
    } else {
      const nachoPayments = await prisma.nacho_payments.findMany({
        where: {
          wallet_address: {
            has: walletAddress,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });
      return nachoPayments.map((payment) => ({
        ...payment,
        nacho_amount: Number(payment.nacho_amount),
      }));
    }
  } catch (error: any) {
    logger.error('DB: Error getting payments by wallet', { error: error.message });
    throw error;
  }
}

export async function getKASPayoutForLast48H(): Promise<KASPayout48H[]> {
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const payments = await prisma.payments.groupBy({
      by: ['wallet_address'],
      where: {
        timestamp: {
          gte: fortyEightHoursAgo,
        },
      },
      _sum: {
        amount: true,
      },
      _min: {
        timestamp: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
    });

    return payments.map((payment) => ({
      wallet_address: payment.wallet_address[0] || '',
      amount: Number(payment._sum.amount || 0),
      timeStamp: payment._min.timestamp || new Date(),
    }));
  } catch (error: any) {
    logger.error('DB: Error getting KAS payout for last 48H', { error: error.message });
    throw error;
  }
}

export async function getTotalKASPayoutForLast24H(): Promise<number> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await prisma.payments.aggregate({
      where: {
        timestamp: {
          gte: twentyFourHoursAgo,
        },
      },
      _sum: {
        amount: true,
      },
    });
    return Number(result._sum.amount || 0);
  } catch (error: any) {
    logger.error('DB: Error getting total KAS payout for last 24H', { error: error.message });
    throw error;
  }
}

export async function getNachoPaymentsGroupedByWallet(): Promise<NachoPaymentGrouped[]> {
  logger.info('DB: getting top miners');
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const payments = await prisma.nacho_payments.groupBy({
      by: ['wallet_address'],
      where: {
        timestamp: {
          gte: fortyEightHoursAgo,
        },
      },
      _sum: {
        nacho_amount: true,
      },
      orderBy: {
        _sum: {
          nacho_amount: 'desc',
        },
      },
    });

    return payments.map((payment) => ({
      wallet_address: payment.wallet_address[0] || '',
      total_nacho_payment_amount: Number(payment._sum.nacho_amount || 0),
    }));
  } catch (error: any) {
    logger.error('DB: Error getting nacho payments grouped by wallet', { error: error.message });
    throw error;
  }
}

export async function getBalanceByWallet(wallet: string): Promise<BalanceByWalletResponse> {
  logger.info(`DB: getting Balance for wallet_address: ${wallet}`);
  try {
    const balances: BalanceByWalletResponse = {};
    const miners = await prisma.miners_balance.findMany({
      where: {
        wallet: wallet,
      },
      select: {
        miner_id: true,
        wallet: true,
        balance: true,
        nacho_rebate_kas: true,
      },
    });

    miners.forEach((row) => {
      if (row.wallet && row.miner_id) {
        const wallet = row.wallet;
        const miner_id = row.miner_id;
        const balance = new Decimal(row.balance || 0);
        const nacho_rebate_kas = new Decimal(row.nacho_rebate_kas || 0);

        if (!balances[wallet]) {
          balances[wallet] = {};
        }

        balances[wallet][miner_id] = [balance, nacho_rebate_kas];
      }
    });

    return balances;
  } catch (error: any) {
    logger.error('DB: Error getting balance by wallet', { error: error.message });
    throw error;
  }
}
