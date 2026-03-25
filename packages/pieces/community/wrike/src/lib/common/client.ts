import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

const WRIKE_API_BASE_URL = 'https://www.wrike.com/api/v4';

export const wrikeCommon = {
    baseUrl: WRIKE_API_BASE_URL,

    async apiCall({
        auth,
        method,
        resourceUri,
        body = undefined,
        queryParams = undefined,
    }: {
        auth: OAuth2PropertyValue;
        method: HttpMethod;
        resourceUri: string;
        body?: any;
        queryParams?: Record<string, string>;
    }) {
        return await httpClient.sendRequest({
            method: method,
            url: `${WRIKE_API_BASE_URL}${resourceUri}`,
            body,
            queryParams,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.access_token,
            }
        });
    }
};
