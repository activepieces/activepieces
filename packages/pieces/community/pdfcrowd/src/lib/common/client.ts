import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { pdfcrowdAuth } from './auth';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

export const BASE_URL = 'https://api.pdfcrowd.com/api';
export const CONVERT_URL = 'https://api.pdfcrowd.com/convert/24.04/';

export async function makeRequest<T>(
    auth: AppConnectionValueForAuthProperty<typeof pdfcrowdAuth>,
    method: HttpMethod,
    path: string,
    body?: unknown,
) {
    const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');

    const response = await httpClient.sendRequest<T>({
        method,
        url: `${BASE_URL}${path}`,
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
        },
        body,
    });
    return response.body;
}

export function getAuthHeader(auth: AppConnectionValueForAuthProperty<typeof pdfcrowdAuth>): string {
    return 'Basic ' + Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
}
