import {
    httpClient,
    HttpMessageBody,
    HttpMethod,
    HttpRequest,
    QueryParams,
} from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.airtop.ai/api/v1';

export type AirtopApiCallParams = {
    apiKey: string;
    method: HttpMethod;
    resourceUri: string;
    query?: Record<string, string | number | string[] | undefined>;
    body?: any;
};

export async function airtopApiCall<T extends HttpMessageBody>({
    apiKey,
    method,
    resourceUri,
    query,
    body,
}: AirtopApiCallParams): Promise<T> {
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
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        queryParams: qs,
        body,
    };

    const response = await httpClient.sendRequest<T>(request);

    if ((response.body as any)?.error || (response.body as any)?.errors?.length) {
        throw new Error(
            (response.body as any)?.error?.message ||
            (response.body as any)?.errors?.[0]?.message ||
            (response.body as any)?.error ||
            'Airtop API error'
        );
    }

    return response.body;
}
