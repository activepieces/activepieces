import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import FormData from 'form-data';
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

export async function makeMultipartRequest({ auth, method, path, form }: MultipartRequestParams) {
    try {
        const response = await httpClient.sendRequest({
            method,
            url: `${BASE_URL}${path}`,
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${auth.secret_text}`,
            },
            body: form,
        });
        return response.body;
    } catch (error) {
        throw new Error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    }
}

type MultipartRequestParams = {
    auth: AppConnectionValueForAuthProperty<typeof frontAuth>;
    method: HttpMethod;
    path: string;
    form: FormData;
};
