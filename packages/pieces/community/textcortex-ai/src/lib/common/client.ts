import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { baseUrl } from './common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { textcortexAuth } from './auth';

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
        auth: AppConnectionValueForAuthProperty<typeof textcortexAuth>;
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
                token: auth.secret_text,
            } as const,
            body,
        };

        return await httpClient.sendRequest(requestConfig);
    },
};
