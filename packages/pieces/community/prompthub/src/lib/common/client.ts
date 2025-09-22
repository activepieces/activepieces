import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://app.prompthub.us/api/v1`;

export async function makeRequest(
    api_key: string,
    method: HttpMethod,
    path: string,
    body?: unknown,
    query?: Record<string, string | number>
) {
    try {
        const url = new URL(`${BASE_URL}${path}`);

        // Attach query params if provided
        if (query) {
            Object.entries(query).forEach(([key, value]) =>
                url.searchParams.append(key, String(value))
            );
        }

        const response = await httpClient.sendRequest({
            method,
            url: url.toString(),
            headers: {
                Authorization: `Bearer ${api_key}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body,
        });

        return response.body;
    } catch (error: any) {
        throw new Error(`Unexpected error: ${error.message || String(error)}`);
    }
}
