import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export interface BrowserlessAuth {
    apiToken: string;
    region: string;
    customBaseUrl?: string;
}

export function convertBinaryToBase64(binaryData: any): string {
    if (typeof binaryData === 'string') {
        return Buffer.from(binaryData, 'binary').toString('base64');
    } else if (binaryData instanceof ArrayBuffer) {
        return Buffer.from(binaryData).toString('base64');
    } else if (Buffer.isBuffer(binaryData)) {
        return binaryData.toString('base64');
    } else {
        return Buffer.from(String(binaryData), 'binary').toString('base64');
    }
}

export function isBinaryResponse(headers: any): boolean {
    const contentType = headers?.get?.('content-type') || headers?.['content-type'] || '';
    return contentType.includes('image/') || 
           contentType.includes('application/pdf') || 
           contentType.includes('application/octet-stream');
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
        const baseUrl = auth.region === 'custom' ? auth.customBaseUrl : auth.region;

        if (!baseUrl) {
            throw new Error('Base URL is required. Please configure your Browserless endpoint.');
        }

        const url = `${baseUrl}${resourceUri}`;

        const requestHeaders = {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            ...headers,
        };

        let responseType: 'json' | 'arraybuffer' | 'text' = 'json';
        if (resourceUri.includes('/screenshot') || resourceUri.includes('/pdf')) {
            responseType = 'arraybuffer';
        }

        const requestConfig = {
            method,
            url,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
            queryParams: { token: auth.apiToken },
            responseType,
        };

        return await httpClient.sendRequest(requestConfig);
    },
};
