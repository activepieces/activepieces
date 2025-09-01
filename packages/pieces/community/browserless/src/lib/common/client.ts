import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export interface BrowserlessAuth {
    apiToken: string;
    baseUrl: string;
}

export const browserlessCommon = {
    async apiCall({
        auth,
        method,
        resourceUri,
        body,
        headers = {},
    }: {
        auth: BrowserlessAuth;
        method: HttpMethod;
        resourceUri: string;
        body?: any;
        headers?: Record<string, string>;
    }) {
        const separator = resourceUri.includes('?') ? '&' : '?';
        const url = `${auth.baseUrl}${resourceUri}${separator}token=${auth.apiToken}`;
        
        const requestHeaders = {
            'Content-Type': 'application/json',
            ...headers,
        };

        return await httpClient.sendRequest({
            method,
            url,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
        });
    },
};
