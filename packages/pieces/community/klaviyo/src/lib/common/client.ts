import { HttpMethod, httpClient } from '@activepieces/pieces-common';

interface KlaviyoAuth {
    api_key: string;
    private_api_key: string;
}

export const BASE_URL = `https://a.klaviyo.com/api`;

export async function makeRequest(
    auth: KlaviyoAuth,
    method: HttpMethod,
    path: string,
    body?: unknown
) {

    const response = await httpClient.sendRequest({
        method,
        url: `${BASE_URL}${path}`,
        headers: {
            'Authorization': `${auth.api_key} ${auth.private_api_key}`,
            'accept': 'application/vnd.api+json',
            'revision': '2025-04-15',
        },
        body,
    });
    return response.body;
}
