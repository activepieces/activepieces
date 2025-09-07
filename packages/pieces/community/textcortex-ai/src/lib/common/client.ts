import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { baseUrl } from './common';

export interface TextCortexAuth {
    auth: string;
}

export const textcortexCommon = {
    async apiCall({
        auth,
        method,
        resourceUri,
        body,
        headers = {},
    }: {
        auth: string;
        method: HttpMethod;
        resourceUri: string;
        body?: any;
        headers?: Record<string, string>;
    }) {
        const url = `${baseUrl}${resourceUri}`;

        const requestHeaders = {
            'Content-Type': 'application/json',
            ...headers,
        };

        const requestConfig = {
            method,
            url,
            headers: requestHeaders,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth,
            } as const,
            body,
        };

        return await httpClient.sendRequest(requestConfig);
    },
};
