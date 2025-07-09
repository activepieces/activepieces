import { HttpMethod, httpClient } from '@activepieces/pieces-common';


export const BASE_URL = `https://a.klaviyo.com/api`;

export async function makeRequest(
    api_key: string,
    method: HttpMethod,
    path: string,
    body?: unknown
) {

    const response = await httpClient.sendRequest({
        method,
        url: `${BASE_URL}${path}`,
        headers: {
            'Authorization': `Klaviyo-API-Key ${api_key}`,
            'accept': 'application/vnd.api+json',
            'revision': '2025-04-15',
        },
        body,
    });
    return response.body;
}
