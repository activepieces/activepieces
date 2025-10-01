import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

const PRODUCTBOARD_API_BASE_URL = 'https://api.productboard.com';

export const productboardCommon = {
    baseUrl: PRODUCTBOARD_API_BASE_URL,

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
            url: `${PRODUCTBOARD_API_BASE_URL}${resourceUri}`,
            body,
            queryParams,
            headers: {
                'Authorization': `Bearer ${auth}`,
                'X-Version': '1',
                'Content-Type': 'application/json',
            }
        });
    }
};
