import axios from 'axios';
import dotenv from 'dotenv';
import rTracer from 'cls-rtracer';

dotenv.config();

const { DATADOG_SECRET, DATADOG_LOG_URL } = process.env;

interface LogContext {
  [key: string]: any;
  requestId?: string;
}

const baseLogObject = {
  ddsource: 'nodejs',
  service: process.env.DATADOG_SERVICE_NAME || 'prod-katpool-monitor',
  timestamp: new Date().toISOString(),
};

const sendLog = async (level: string, message: string, context: LogContext = {}) => {
  console.log(level, message, context);
  // backgroud servers startMetricsServer, updateMetrics does not have requestId
  // not all logs will be sent to Datadog, only logs with requestId will be sent
  const requestId: string = String(context.requestId || rTracer.id());
  if (requestId && requestId !== 'undefined') {
    try {
      await axios.post(
        DATADOG_LOG_URL!,
        {
          ...baseLogObject,
          ...context,
          requestId: requestId.toString(),
          level,
          message,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'DD-API-KEY': DATADOG_SECRET!,
          },
        }
      );
    } catch (error) {
      console.error(`Failed to send log to Datadog | ${error}`);
      await axios.post(
        DATADOG_LOG_URL!,
        {
          ...baseLogObject,
          level: 'error',
          message: `Failed to send log to Datadog | ${error}`,
          error: error instanceof Error ? error.stack : error,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'DD-API-KEY': DATADOG_SECRET!,
          },
        }
      );
    }
  }
};

const logger = {
  info: (message: string, context?: LogContext) => sendLog('info', message, context),
  error: (message: string, context?: LogContext) => sendLog('error', message, context),
  warn: (message: string, context?: LogContext) => sendLog('warn', message, context),
};

export default logger;
