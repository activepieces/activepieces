import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

export const DATACIRCLE_API_URL = 'https://api.datacircle.dev';

export async function datacircleRequest<T>({
    apiKey,
    method,
    path,
    provider,
    body,
    queryParams,
}: {
    apiKey: string;
    method: HttpMethod;
    path: string;
    provider?: string;
    body?: unknown;
    queryParams?: QueryParams;
}): Promise<T> {
    const response = await httpClient.sendRequest<T>({
        method,
        url: `${DATACIRCLE_API_URL}${path}`,
        headers: {
            Authorization: `Bearer ${apiKey}`,
            ...(provider ? { 'X-Data-Provider': provider } : {}),
        },
        queryParams,
        body,
    });
    return response.body;
}
