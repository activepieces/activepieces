import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://www.formstack.com/api/v2';

export async function makeRequest(
    accessToken: string,
    method: HttpMethod,
    path: string,
    body?: unknown,
    queryParams?: Record<string, any>,
) {
    try {
        const response = await httpClient.sendRequest({
            method,
            url: `${BASE_URL}${path}`,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body,
            queryParams,
        });

        return response.body;
    } catch (error: any) {
        // Generic error handling
        throw new Error(`Request failed: ${error.error || 'Unknown error'}`);
    }
}
