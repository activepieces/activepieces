import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const CONNECTUC_BASE_URL = 'https://api.connectuc.io';

interface ApiCallParams {
    accessToken: string;
    endpoint: string;
    method: HttpMethod;
    body?: unknown;
    queryParams?: Record<string, string>;
}

export async function connectucApiCall<T = unknown>(params: ApiCallParams): Promise<T> {
    const { accessToken, endpoint, method, body, queryParams } = params;

    const response = await httpClient.sendRequest<T>({
        method,
        url: `${CONNECTUC_BASE_URL}${endpoint}`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: accessToken,
        },
        body,
        queryParams,
    });

    return response.body;
}

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
