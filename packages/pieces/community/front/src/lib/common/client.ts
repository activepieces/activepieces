import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { frontAuth } from './auth';

export const BASE_URL = `https://api2.frontapp.com`;

export async function makeRequest(
    {secret_text}: AppConnectionValueForAuthProperty<typeof frontAuth>,
    method: HttpMethod,
    path: string,
    body?: unknown
) {
    try {
        const response = await httpClient.sendRequest({
            method,
            url: `${BASE_URL}${path}`,
            headers: {
                Authorization: `Bearer ${secret_text}`,
                'Content-Type': 'application/json',
            },
            body,
        });
        return response.body;
    } catch (error: any) {
        throw new Error(`Unexpected error: ${error.message || String(error)}`);
    }
}

// No Content-Type on purpose: fetch has to set it so it can add the boundary.
export async function makeMultipartRequest(
    {secret_text}: AppConnectionValueForAuthProperty<typeof frontAuth>,
    method: HttpMethod,
    path: string,
    form: FormData
) {
    try {
        const response = await httpClient.sendRequest({
            method,
            url: `${BASE_URL}${path}`,
            headers: {
                Authorization: `Bearer ${secret_text}`,
            },
            body: form,
        });
        return response.body;
    } catch (error: any) {
        throw new Error(`Unexpected error: ${error.message || String(error)}`);
    }
}
