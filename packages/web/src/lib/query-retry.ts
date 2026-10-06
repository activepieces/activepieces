import { isAxiosError } from 'axios';
import { StatusCodes } from 'http-status-codes';

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) {
    return false;
  }
  const status = isAxiosError(error) ? error.response?.status : undefined;
  if (status === undefined) {
    return true;
  }
  if (RETRYABLE_CLIENT_STATUSES.has(status)) {
    return true;
  }
  return status >= StatusCodes.INTERNAL_SERVER_ERROR;
}

function queryRetryDelay(attemptIndex: number): number {
  return Math.min(BASE_RETRY_DELAY_MS * 2 ** attemptIndex, MAX_RETRY_DELAY_MS);
}

const MAX_QUERY_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 400;
const MAX_RETRY_DELAY_MS = 1500;
const RETRYABLE_CLIENT_STATUSES = new Set<number>([
  StatusCodes.REQUEST_TIMEOUT,
]);

export const queryRetry = {
  shouldRetry: shouldRetryQuery,
  delay: queryRetryDelay,
  maxRetries: MAX_QUERY_RETRIES,
};
