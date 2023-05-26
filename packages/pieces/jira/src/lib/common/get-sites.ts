import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";

export interface Site {
    id: string,
    url: string,
    name: string,
    scopes: string[],
    avatarUrl: string
}

export async function getSites(accessToken: string): Promise<Site[]> {
    const res = await httpClient.sendRequest<Site[]>({
        method: HttpMethod.GET,
        url: 'https://api.atlassian.com/oauth/token/accessible-resources',
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: accessToken
        }
    });
    return res.body;
}