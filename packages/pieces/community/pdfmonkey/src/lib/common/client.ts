import { HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';
import { pdfmonkeyAuth } from './auth';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';


export const BASE_URL = `https://api.pdfmonkey.io/api/v1`;

export async function makeRequest<T>(
    api_key: AppConnectionValueForAuthProperty<typeof pdfmonkeyAuth>,
    method: HttpMethod,
    path: string,
    query?:QueryParams,
    body?: unknown,
) {
    try {
    
        const response = await httpClient.sendRequest<T>({
            method,
            url: `${BASE_URL}${path}`,
            headers: {
                'Authorization': `Bearer ${api_key.secret_text}`,
                'Content-Type': 'application/json',
            },
            body,
            queryParams:query
        });
        return response.body;

    } catch (error: any) {
        throw new Error(`Unexpected error: ${error.message || String(error)}`);
    }

}