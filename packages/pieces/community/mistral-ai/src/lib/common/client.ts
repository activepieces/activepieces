import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.mistral.ai/v1';

export async function makeRequest(
    api_key: string,
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
                'Authorization': `Bearer ${api_key}`,
                'Content-Type': 'application/json',
            },
            body,
            queryParams,
        });

        return response.body;
    } catch (error: any) {
        if (error.status === 422 && error.body && error.body.detail) {
            const details = error.body.detail
                .map((d: any) => `[${d.loc.join('.')}] ${d.msg} (${d.type})`)
                .join('; ');
            throw new Error(`Validation Error: ${details}`);
        }
        // Generic error handling
        throw new Error(`Request failed: ${error.error || 'Unknown error'}`);
    }
}