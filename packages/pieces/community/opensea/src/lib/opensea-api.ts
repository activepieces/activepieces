import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.opensea.io/api/v2';

export async function openSeaApiCall<T>(
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
      'X-API-KEY': apiKey,
      Accept: 'application/json',
    },
  });

  return response.body;
}

export async function getNft(
  apiKey: string,
  chain: string,
  address: string,
  identifier: string
): Promise<unknown> {
  return openSeaApiCall(
    apiKey,
    HttpMethod.GET,
    `/chain/${chain}/contract/${address}/nfts/${identifier}`
  );
}

export async function listNftsByCollection(
  apiKey: string,
  collectionSlug: string,
  limit = '20',
  next?: string
): Promise<unknown> {
  const params: Record<string, string> = { limit };
  if (next) params['next'] = next;
  return openSeaApiCall(
    apiKey,
    HttpMethod.GET,
    `/collection/${collectionSlug}/nfts`,
    params
  );
}

export async function getCollectionStats(
  apiKey: string,
  collectionSlug: string
): Promise<unknown> {
  return openSeaApiCall(
    apiKey,
    HttpMethod.GET,
    `/collections/${collectionSlug}/stats`
  );
}

export async function getListings(
  apiKey: string,
  collectionSlug: string,
  limit = '20'
): Promise<unknown> {
  return openSeaApiCall(
    apiKey,
    HttpMethod.GET,
    `/listings/collection/${collectionSlug}/best`,
    { limit }
  );
}

export async function getOffers(
  apiKey: string,
  collectionSlug: string,
  limit = '20'
): Promise<unknown> {
  return openSeaApiCall(
    apiKey,
    HttpMethod.GET,
    `/offers/collection/${collectionSlug}/best`,
    { limit }
  );
}
