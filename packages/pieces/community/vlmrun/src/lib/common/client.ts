import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://api.vlm.run/v1`;



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
                Authorization: `Bearer ${api_key}`,
                'Content-Type': 'application/json',
            },
            body,
        });
        return response.body;
    } catch (error: any) {
        // You might want more detailed error parsing (e.g. status codes)
        throw new Error(`Unexpected error: ${error.message || String(error)}`);
    }
}
