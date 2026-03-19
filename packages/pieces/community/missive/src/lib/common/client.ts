import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { missiveAuth } from './auth';

const MISSIVE_API_BASE_URL = 'https://public.missiveapp.com/v1';

export const missiveCommon = {
    baseUrl: MISSIVE_API_BASE_URL,
    
    async apiCall({
        auth,
        method,
        resourceUri,
        body = undefined,
        queryParams = undefined,
    }: {
        auth: AppConnectionValueForAuthProperty<typeof missiveAuth>;
        method: HttpMethod;
        resourceUri: string;
        body?: any;
        queryParams?: Record<string, string>;
    }) {
        return await httpClient.sendRequest({
            method: method,
            url: `${MISSIVE_API_BASE_URL}${resourceUri}`,
            body,
            queryParams,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.secret_text,
            }
        });
    }
}; 