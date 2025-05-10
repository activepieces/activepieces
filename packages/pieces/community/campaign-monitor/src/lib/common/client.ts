import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.createsend.com/api/v3.3';

export interface CampaignMonitorAuth {
    apiKey: string;
}

export async function makeRequest(auth: CampaignMonitorAuth, method: HttpMethod, path: string, body?: unknown) {
    const response = await httpClient.sendRequest({
        method,
        url: `${BASE_URL}${path}`,
        headers: {
            'Content-Type': 'application/json',
        },
        authentication: {
            type: AuthenticationType.BASIC,
            username: auth.apiKey,
            password: 'x',
        },
        body,
    });
    return response.body;
}
