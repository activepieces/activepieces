import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BasicAuthConnectionValue, CustomAuthConnectionValue } from '@activepieces/shared';

export const BASE_URL = 'https://api.cloudinary.com/v1_1';

export async function makeRequest(
    auth: any,
    method: HttpMethod,
    path: string,
    body?: unknown,
    queryParams?: Record<string, any>,
) {
    try {
        const api_key = auth.api_key.trim()
        const api_secret = auth.api_secret.trim()
        const cloud_name = auth.cloud_name.trim()

        const response = await httpClient.sendRequest({
            method,
            url: `${BASE_URL}/${cloud_name}${path}`,
            headers: {
                'Authorization': `Basic ${Buffer.from(`${api_key}:${api_secret}`).toString('base64')}`,
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