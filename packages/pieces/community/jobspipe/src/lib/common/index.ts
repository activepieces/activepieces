import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.jobspipe.dev';

export async function makeJobsPipeRequest<T>({
    apiKey,
    method,
    path,
    body,
}: {
    apiKey: string;
    method: HttpMethod;
    path: string;
    body?: unknown;
}): Promise<T> {
    const request: HttpRequest = {
        method,
        url: `${BASE_URL}${path}`,
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
    };

    if (body) {
        request.body = body;
    }

    const response = await httpClient.sendRequest<T>(request);
    return response.body;
}
