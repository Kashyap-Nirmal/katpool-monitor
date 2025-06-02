import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const { DATADOG_SECRET, DATADOG_LOG_URL } = process.env;

interface LogContext {
  [key: string]: any;
  requestId?: string;
}

const sendLog = async (level: string, message: string, context: LogContext = {}) => {
  const logData = {
    ddsource: 'nodejs',
    service: 'katpool-monitor',
    level,
    message,
    ...context,
    timestamp: new Date().toISOString(),
  };

  try {
    await axios.post(DATADOG_LOG_URL!, logData, {
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': DATADOG_SECRET!,
      },
    });
  } catch (error) {
    throw new Error(`Failed to send log to Datadog: ${error}`);
  }
};

const logger = {
  info: (message: string, context?: LogContext) => sendLog('info', message, context),
  error: (message: string, context?: LogContext) => sendLog('error', message, context),
  warn: (message: string, context?: LogContext) => sendLog('warn', message, context),
};

export default logger;
