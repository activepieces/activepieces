import { HttpRequest, HttpMethod, httpClient, HttpError } from '@activepieces/pieces-common';
import { helpScoutAuth } from './auth';

const BASE_URL = 'https://api.helpscout.net/v2';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error: any): string {
  if (error?.response?.body?.message) return error.response.body.message;
  if (error?.response?.body?.error) return error.response.body.error;
  if (error?.message) return error.message;
  return 'Unknown error occurred';
}

export async function helpScoutApiRequest<T>(params: {
  method: HttpMethod,
  url: string,
  auth: any,
  body?: any,
  queryParams?: Record<string, any>,
}): Promise<T> {
  let attempt = 0;
  let lastError: any = null;
  while (attempt < MAX_RETRIES) {
    try {
      const request: HttpRequest = {
        method: params.method,
        url: `${BASE_URL}${params.url}`,
        headers: {
          Authorization: `Bearer ${params.auth.access_token}`,
          'Content-Type': 'application/json',
        },
        body: params.body,
        queryParams: params.queryParams,
      };
      const response = await httpClient.sendRequest<T>(request);
      if (response.status >= 200 && response.status < 300) {
        return response.body;
      } else {
        const errorMsg = getErrorMessage(response.body);
        throw new Error(`Help Scout API Error (${response.status}): ${errorMsg}`);
      }
    } catch (error: any) {
      lastError = error;
      if (error?.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '1', 10) * 1000;
        await sleep(retryAfter || RETRY_DELAY_MS);
        attempt++;
        continue;
      }
      if (error instanceof HttpError || error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        attempt++;
        continue;
      }
      console.error('Help Scout API Error:', error);
      throw new Error(getErrorMessage(error));
    }
  }
  console.error('Help Scout API: All retries failed', lastError);
  throw new Error(`Help Scout API request failed after ${MAX_RETRIES} attempts: ${getErrorMessage(lastError)}`);
} 