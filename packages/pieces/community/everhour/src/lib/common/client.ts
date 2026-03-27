import {
    httpClient,
    HttpMessageBody,
    HttpMethod,
    HttpRequest,
    QueryParams,
} from '@activepieces/pieces-common';

export type EverhourApiCallParams = {
    apiKey: string;
    method: HttpMethod;
    resourceUri: string;
    query?: Record<string, string | number | undefined>;
    body?: unknown;
};

export const BASE_URL = 'https://api.everhour.com';

export async function everhourApiCall<T extends HttpMessageBody>({
    apiKey,
    method,
    resourceUri,
    query,
    body,
}: EverhourApiCallParams): Promise<T> {
    const qs: QueryParams = {};

    if (query) {
        for (const [key, value] of Object.entries(query)) {
            if (value !== null && value !== undefined) {
                qs[key] = String(value);
            }
        }
    }

    const request: HttpRequest = {
        method,
        url: BASE_URL + resourceUri,
        headers: {
            'X-Api-Key': apiKey,
            'Content-Type': 'application/json',
        },
        queryParams: qs,
        body,
    };

    const response = await httpClient.sendRequest<T>(request);
    return response.body;
}