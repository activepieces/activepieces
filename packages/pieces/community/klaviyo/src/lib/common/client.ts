import { HttpMethod, httpClient } from '@activepieces/pieces-common';

interface KommoAuth {
    api_key: string;
    private_api_key: string;
}

export const baseurl = `https://a.klaviyo.com/api`;

export async function makeRequest(
    auth: KommoAuth,
    method: HttpMethod,
    path: string,
    body?: unknown
) {

    const response = await httpClient.sendRequest({
        method,
        url: baseurl,
        headers: {
            Authorization: `${auth.api_key} ${auth.private_api_key}`,
            'Content-Type': 'application/json',
            'accept': 'application/vnd.api+json',
            'revision': '2025-04-15',

        },
        body,
    });

    return response.body;
}
