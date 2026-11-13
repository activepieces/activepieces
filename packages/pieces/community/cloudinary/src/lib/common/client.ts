import crypto from 'crypto';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { BasicAuthConnectionValue, CustomAuthConnectionValue } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from './auth';

export const BASE_URL = 'https://api.cloudinary.com/v1_1';

export async function makeRequest(
    auth: AppConnectionValueForAuthProperty<typeof cloudinaryAuth>,
    method: HttpMethod,
    path: string,
    body?: unknown,
    queryParams?: Record<string, any>,
) {
    try {
        const api_key = auth.props.api_key.trim();
        const api_secret = auth.props.api_secret.trim();
        const cloud_name = auth.props.cloud_name.trim();

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
            url: `${BASE_URL}/${cloud_name}${path}${toQueryString({ query: queryParams })}`,
            headers,
            body,
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

export function buildSignedUrl({ auth, path, params }: SignedUrlParams): string {
    const api_key = auth.props.api_key.trim();
    const api_secret = auth.props.api_secret.trim();
    const cloud_name = auth.props.cloud_name.trim();
    const withTimestamp: SignedUrlParams['params'] = { ...params, timestamp: Math.floor(Date.now() / 1000) };
    const signable = Object.fromEntries(
        Object.entries(withTimestamp).filter(
            (entry): entry is [string, string | number | boolean] => entry[1] !== undefined && entry[1] !== '',
        ),
    );
    const toSign = Object.keys(signable)
        .sort()
        .map((key) => `${key}=${signable[key]}`)
        .join('&');
    const signature = crypto.createHash('sha1').update(toSign + api_secret).digest('hex');
    const search = new URLSearchParams(
        Object.entries({ ...signable, api_key, signature }).map(([key, value]) => [key, String(value)]),
    );
    return `${BASE_URL}/${cloud_name}${path}?${search.toString()}`;
}

function toQueryString({ query }: { query?: Record<string, unknown> }): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
        if (value === undefined || value === null || value === '') {
            continue;
        }
        if (Array.isArray(value)) {
            value.forEach((item) => params.append(`${key}[]`, String(item)));
        } else {
            params.append(key, String(value));
        }
    }
    const search = params.toString();
    return search ? `?${search}` : '';
}

export type ResourceList = {
    resources: Record<string, unknown>[];
    next_cursor?: string;
    total_count?: number;
};

type SignedUrlParams = {
    auth: AppConnectionValueForAuthProperty<typeof cloudinaryAuth>;
    path: string;
    params: Record<string, string | number | boolean | undefined>;
};
