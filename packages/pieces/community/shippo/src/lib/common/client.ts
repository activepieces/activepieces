import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

const SHIPPO_API_BASE_URL = 'https://api.goshippo.com';

export const shippoCommon = {
    baseUrl: SHIPPO_API_BASE_URL,

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
            url: `${SHIPPO_API_BASE_URL}${resourceUri}`,
            body,
            queryParams,
            headers: {
                'Authorization': `ShippoToken ${auth}`,
                'Content-Type': 'application/json',
            }
        });
    }
};
