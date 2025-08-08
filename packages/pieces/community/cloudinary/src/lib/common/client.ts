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

        let headers: Record<string, string> = {};
        

        if (body && typeof body === 'object' && typeof (body as any).getHeaders === 'function') {
            headers = {
                ...headers,
                ...(body as any).getHeaders(),
            };
        } else {
            headers = {
                'Authorization': `Basic ${Buffer.from(`${api_key}:${api_secret}`).toString('base64')}`,
                'Content-Type': 'application/json',
            };
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
        if (error.response) {
            const status = error.response.status;
            switch (status) {
                case 400:
                    throw new Error(`Bad request: ${error.response.body?.error?.message || 'Invalid request parameters'}`);
                case 401:
                    throw new Error(`Authorization required: ${error.response.body?.error?.message || 'Invalid API credentials'}`);
                case 403:
                    throw new Error(`Not allowed: ${error.response.body?.error?.message || 'Insufficient permissions'}`);
                case 404:
                    throw new Error(`Not found: ${error.response.body?.error?.message || 'Resource not found'}`);
                case 420:
                    throw new Error(`Rate limited: ${error.response.body?.error?.message || 'Too many requests'}`);
                case 500:
                    throw new Error(`Internal server error: ${error.response.body?.error?.message || 'Cloudinary server error'}`);
                default:
                    throw new Error(`Request failed (${status}): ${error.response.body?.error?.message || 'Unknown error'}`);
            }
        }
        throw new Error(`Request failed: ${error.message || 'Unknown error'}`);
    }
}