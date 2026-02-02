import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://api.videoask.com`;

export async function makeRequest(
    organizationId: string,
    access_token: string,
    method: HttpMethod,
    path: string,
    body?: unknown
) {
    try {
        const response = await httpClient.sendRequest({
            method,
            url: `${BASE_URL}${path}`,
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json',
                'organization-id': organizationId,
            },
            body,
        });
        return response.body;
    } catch (error: any) {
        throw new Error(`Unexpected error: ${error.message || String(error)}`);
    }
}
