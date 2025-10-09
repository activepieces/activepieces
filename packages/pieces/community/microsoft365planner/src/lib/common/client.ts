import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://graph.microsoft.com/v1.0`;

export async function makeRequest(
    accessToken: string,
    method: HttpMethod,
    path: string,
    body?: unknown,
    extraHeaders: Record<string, string> = {}
) {
    try {
        const response = await httpClient.sendRequest({
            method,
            url: `${BASE_URL}${path}`,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                ...extraHeaders,
            },
            body,
        });
        return response.body;
    } catch (error: any) {
        throw new Error(`Unexpected error: ${error.message || String(error)}`);
    }
}
