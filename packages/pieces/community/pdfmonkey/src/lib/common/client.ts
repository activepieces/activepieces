import { HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';


export const BASE_URL = `https://api.pdfmonkey.io/api/v1`;

export async function makeRequest<T>(
    api_key: string,
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
                'Authorization': `Bearer ${api_key}`,
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