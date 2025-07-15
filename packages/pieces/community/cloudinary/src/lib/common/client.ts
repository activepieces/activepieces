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
        const api_key = auth.api_key.trim();
        const api_secret = auth.api_secret.trim();
        const cloud_name = auth.cloud_name.trim();

        // Detect FormData
        let headers: Record<string, string> = {
            'Authorization': `Basic ${Buffer.from(`${api_key}:${api_secret}`).toString('base64')}`,
        };
        if (body && typeof body === 'object' && typeof (body as any).getHeaders === 'function') {
            headers = {
                ...headers,
                ...(body as any).getHeaders(),
            };
        } else {
            headers['Content-Type'] = 'application/json';
        }

        const response = await httpClient.sendRequest({
            method,
            url: `${BASE_URL}/${cloud_name}${path}`,
            headers,
            body,
            queryParams,
        });

        return response.body;
    } catch (error: any) {
        throw new Error(`Request failed: ${error.error || 'Unknown error'}`);
    }
}