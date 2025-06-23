import {
    httpClient,
    HttpMessageBody,
    HttpMethod,
    HttpRequest,
    QueryParams,
} from '@activepieces/pieces-common';

export type CanvaApiCallParams = {
    accessToken: string;
    method: HttpMethod;
    resourceUri: string;
    query?: Record<string, string | number | string[] | undefined>;
    body?: any;
};

export const BASE_URL = 'https://api.canva.com';

export async function canvaApiCall<T extends HttpMessageBody>({
    accessToken,
    method,
    resourceUri,
    query,
    body,
}: CanvaApiCallParams): Promise<T> {
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
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        queryParams: qs,
        body,
    };

    const response = await httpClient.sendRequest<T>(request);
    return response.body;
}
