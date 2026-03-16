import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const WHALE_ALERT_BASE_URL = 'https://api.whale-alert.io/v1';

export interface WhaleAlertTransaction {
  id: string;
  blockchain: string;
  symbol: string;
  id_human: string;
  transaction_type: string;
  hash: string;
  from: {
    address: string;
    owner?: string;
    owner_type?: string;
  };
  to: {
    address: string;
    owner?: string;
    owner_type?: string;
  };
  timestamp: number;
  amount: number;
  amount_usd: number;
  transaction_count?: number;
}

export interface WhaleAlertResponse {
  result: string;
  cursor?: string;
  count?: number;
  transactions?: WhaleAlertTransaction[];
}

export async function makeWhaleAlertRequest<T = unknown>(
  apiKey: string,
  endpoint: string,
  queryParams: Record<string, string | number | undefined> = {}
): Promise<T> {
  const params: Record<string, string> = { api_key: apiKey };
  for (const [key, value] of Object.entries(queryParams)) {
    if (value !== undefined && value !== null && value !== '') {
      params[key] = String(value);
    }
  }

  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: `${WHALE_ALERT_BASE_URL}${endpoint}`,
    queryParams: params,
  });

  return response.body;
}
