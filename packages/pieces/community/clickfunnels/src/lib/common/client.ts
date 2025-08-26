import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const clickfunnelsCommon = {
    async apiCall({
        auth,
        method,
        resourceUri,
        body = undefined,
        queryParams = undefined,
        subdomain,
    }: {
        auth: OAuth2PropertyValue;
        method: HttpMethod;
        resourceUri: string;
        body?: any;
        queryParams?: Record<string, string>;
        subdomain: string;
    }) {
        const baseUrl = `https://${subdomain}.myclickfunnels.com/api/v2`;
        
        return await httpClient.sendRequest({
            method: method,
            url: `${baseUrl}${resourceUri}`,
            body,
            queryParams,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.access_token,
            },
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        });
    },

    extractSubdomain(auth: OAuth2PropertyValue): string {
        const tokenPayload = JSON.parse(Buffer.from(auth.access_token.split('.')[1], 'base64').toString());
        return tokenPayload.subdomain || 'app';
    }
};
