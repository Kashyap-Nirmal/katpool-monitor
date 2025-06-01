import rateLimit from 'express-rate-limit';
import { RequestHandler } from 'express';

// Centralized rate limiter for all routes
export const apiLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export function stringifyHashrate(ghs: number): string {
  const unitStrings = ['M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
  let unit = unitStrings[0];
  let hr = ghs * 1000; // Default to MH/s

  for (const u of unitStrings) {
    if (hr < 1000) {
      unit = u;
      break;
    }
    hr /= 1000;
  }

  return `${hr.toFixed(2)}${unit}H/s`;
}
