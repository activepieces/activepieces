import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

const EMAILOCTOPUS_API_BASE_URL = 'https://api.emailoctopus.com';

export const emailoctopusCommon = {
    baseUrl: EMAILOCTOPUS_API_BASE_URL,

    async apiCall({
        auth,
        method,
        resourceUri,
        body = undefined,
        queryParams = undefined,
    }: {
        auth: string;
        method: HttpMethod;
        resourceUri: string;
        body?: any;
        queryParams?: Record<string, string>;
    }) {
        return await httpClient.sendRequest({
            method: method,
            url: `${EMAILOCTOPUS_API_BASE_URL}${resourceUri}`,
            body,
            queryParams,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth,
            }
        });
    }
};
