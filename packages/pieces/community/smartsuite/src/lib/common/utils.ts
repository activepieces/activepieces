import { SmartSuiteError } from './types';
import { ERROR_MESSAGES } from './constants';

const RATE_LIMIT = {
  MAX_REQUESTS_PER_SECOND: 5,
  RETRY_AFTER_SECONDS: 30,
};

let requestCount = 0;
let lastResetTime = Date.now();

export const handleRateLimit = async (error: any): Promise<void> => {
  if (error?.status === 429) {
    console.warn('Rate limit exceeded, waiting for retry...');
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.RETRY_AFTER_SECONDS * 1000));
    return;
  }
  throw error;
};

export const checkRateLimit = (): boolean => {
  const now = Date.now();
  if (now - lastResetTime >= 1000) {
    requestCount = 0;
    lastResetTime = now;
  }
  
  if (requestCount >= RATE_LIMIT.MAX_REQUESTS_PER_SECOND) {
    return false;
  }
  
  requestCount++;
  return true;
};

export const handleSmartSuiteError = (error: any): SmartSuiteError => {
  if (error?.status === 429) {
    return {
      status: 429,
      message: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
      details: {
        retryAfter: RATE_LIMIT.RETRY_AFTER_SECONDS,
        maxRequestsPerSecond: RATE_LIMIT.MAX_REQUESTS_PER_SECOND,
      },
    };
  }

  if (error?.status === 401) {
    return {
      status: 401,
      message: ERROR_MESSAGES.INVALID_API_KEY,
    };
  }

  if (error?.status === 403) {
    return {
      status: 403,
      message: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
    };
  }

  if (error?.status === 404) {
    return {
      status: 404,
      message: ERROR_MESSAGES.RESOURCE_NOT_FOUND,
    };
  }

  return {
    status: error?.status || 500,
    message: error?.message || ERROR_MESSAGES.UNKNOWN_ERROR,
    details: error?.details,
  };
}; 