import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const CONNECTUC_BASE_URL = 'https://staging.connectuc.engineering';

interface ApiCallParams {
    accessToken: string;
    endpoint: string;
    method: HttpMethod;
    body?: unknown;
}

/**
 * Makes an authenticated API call to the ConnectUC API
 * @param params - API call parameters including auth token, endpoint, method, and optional body
 * @returns The response body from the API
 */
export async function connectucApiCall<T = unknown>(params: ApiCallParams): Promise<T> {
    const { accessToken, endpoint, method, body } = params;

    const response = await httpClient.sendRequest<T>({
        method,
        url: `${CONNECTUC_BASE_URL}${endpoint}`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: accessToken,
        },
        body,
    });

    return response.body;
}

/**
 * Gets the user ID from the OAuth2 userinfo endpoint
 * @param accessToken - The OAuth2 access token
 * @returns The user ID (sub claim) from the userinfo endpoint
 */
export async function getUserId(accessToken: string): Promise<string> {
    const userInfoResponse = await httpClient.sendRequest<{ sub: string }>({
        method: HttpMethod.GET,
        url: 'https://auth.uc-technologies.com/oauth2/userinfo',
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: accessToken,
        },
    });

    return userInfoResponse.body.sub;
}
