import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://api.socialkit.dev`;

export async function makeRequest(
    accessKey: string,
    method: HttpMethod,
    path: string,
    body?: unknown
) {
    try {
        const response = await httpClient.sendRequest({
            method,
            url: `${BASE_URL}${path}`,
            headers: {
                'x-access-key': accessKey,
                'Content-Type': 'application/json',
            },
            body,
        });

        return response.body;
    } catch (error: any) {
        throw new Error(`Unexpected error from SocialKit API: ${error.message || String(error)}`);
    }
}
