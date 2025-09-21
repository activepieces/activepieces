import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

const TEAMWORK_API_BASE_URL = 'https://api.teamwork.com';

export const teamworkCommon = {
    baseUrl: TEAMWORK_API_BASE_URL,
    
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
        const response = await httpClient.sendRequest({
            method: method,
            url: `${TEAMWORK_API_BASE_URL}${resourceUri}`,
            body,
            queryParams,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.access_token,
            }
        });
        
        return response.body;
    }
};
