import { HttpMethod, httpClient } from '@activepieces/pieces-common';


export const BASE_URL = `https://a.klaviyo.com/api`;

export async function makeRequest(
    api_key: string,
    method: HttpMethod,
    path: string,
    body?: unknown
) {
    try {
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
        
    } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            throw new Error('Authentication failed. Please check your API key.');
        }

        if (error.response?.status === 429) {
            throw new Error('Rate limit exceeded. Please wait and try again.');
        }

        if (error.response?.status >= 400 && error.response?.status < 500) {
            throw new Error(
                `Client error: ${error.response?.body?.message || JSON.stringify(error.response?.body)}`
            );
        }

        if (error.response?.status >= 500) {
            throw new Error('Server error from Klaviyo API. Please try again later.');
        }

        throw new Error(`Unexpected error: ${error.message || String(error)}`);
    }

}
