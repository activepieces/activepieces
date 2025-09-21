import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

const WHATCONVERTS_API_BASE_URL = 'https://app.whatconverts.com/api/v1';

export type WhatConvertsAuth = {
    api_key: string;
};

export const whatconvertsCommon = {
    baseUrl: WHATCONVERTS_API_BASE_URL,

    async apiCall({
        auth,
        method,
        resourceUri,
        body = undefined,
        queryParams = undefined,
    }: {
        auth: WhatConvertsAuth;
        method: HttpMethod;
        resourceUri: string;
        body?: any;
        queryParams?: Record<string, string>;
    }) {
        const [token, secret] = auth.api_key.split(':');

        if (!token || !secret) {
            throw new Error('Invalid API key format. Expected format: token:secret');
        }

        return await httpClient.sendRequest({
            method: method,
            url: `${WHATCONVERTS_API_BASE_URL}${resourceUri}`,
            body,
            queryParams,
            authentication: {
                type: AuthenticationType.BASIC,
                username: token,
                password: secret,
            }
        });
    }
};
