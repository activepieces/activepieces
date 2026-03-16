import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.zerion.io/v1';

function getAuthHeader(apiKey: string): string {
  return 'Basic ' + Buffer.from(apiKey + ':').toString('base64');
}

export async function zerionApiCall<T>(
  apiKey: string,
  method: HttpMethod,
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  let url = BASE_URL + endpoint;
  if (params && Object.keys(params).length > 0) {
    const query = new URLSearchParams(params).toString();
    url = url + '?' + query;
  }

  const response = await httpClient.sendRequest<T>({
    method,
    url,
    headers: {
      Authorization: getAuthHeader(apiKey),
      Accept: 'application/json',
    },
  });

  return response.body;
}

export async function getWalletPortfolio(
  apiKey: string,
  walletAddress: string,
  currency = 'usd'
): Promise<unknown> {
  return zerionApiCall(
    apiKey,
    HttpMethod.GET,
    '/wallets/' + walletAddress + '/portfolio',
    { currency }
  );
}

export async function getWalletPositions(
  apiKey: string,
  walletAddress: string,
  currency = 'usd',
  filterPositionTypes = 'wallet'
): Promise<unknown> {
  return zerionApiCall(
    apiKey,
    HttpMethod.GET,
    '/wallets/' + walletAddress + '/positions',
    { currency, 'filter[position_types]': filterPositionTypes }
  );
}

export async function getWalletTransactions(
  apiKey: string,
  walletAddress: string,
  currency = 'usd',
  pageSize = '25'
): Promise<unknown> {
  return zerionApiCall(
    apiKey,
    HttpMethod.GET,
    '/wallets/' + walletAddress + '/transactions',
    { currency, 'page[size]': pageSize }
  );
}

export async function getWalletNfts(
  apiKey: string,
  walletAddress: string,
  currency = 'usd'
): Promise<unknown> {
  return zerionApiCall(
    apiKey,
    HttpMethod.GET,
    '/wallets/' + walletAddress + '/nft-positions',
    { currency }
  );
}

export async function getFungibleInfo(
  apiKey: string,
  fungibleId: string,
  currency = 'usd'
): Promise<unknown> {
  return zerionApiCall(
    apiKey,
    HttpMethod.GET,
    '/fungibles/' + fungibleId,
    { currency }
  );
}
