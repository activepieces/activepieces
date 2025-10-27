import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

const USCREEN_API_BASE_URL = 'https://api.uscreen.io';

export const uscreenCommon = {
    baseUrl: USCREEN_API_BASE_URL,

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
            url: `${USCREEN_API_BASE_URL}${resourceUri}`,
            body,
            queryParams,
            headers: {
                'Authorization': `Bearer ${auth}`,
                'Content-Type': 'application/json',
            }
        });
    }
};
