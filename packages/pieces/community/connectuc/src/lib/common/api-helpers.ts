import { httpClient, HttpMethod, AuthenticationType, HttpError } from '@activepieces/pieces-common';

export const CONNECTUC_BASE_URL = 'https://api.connectuc.io';

interface ApiCallParams {
    accessToken: string;
    endpoint: string;
    method: HttpMethod;
    body?: unknown;
    queryParams?: Record<string, string>;
    timeout?: number;
}

export async function connectucApiCall<T = unknown>(params: ApiCallParams): Promise<T> {
    const { accessToken, endpoint, method, body, queryParams, timeout } = params;

    const response = await httpClient.sendRequest<T>({
        method,
        url: `${CONNECTUC_BASE_URL}${endpoint}`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: accessToken,
        },
        body,
        queryParams,
        timeout,
    });

    return response.body;
}

export function formatApiError(error: unknown): string {
    if (error instanceof HttpError) {
        const body = error.response.body;
        return hasMessage(body) ? `${error.response.status}: ${body.message}` : `${error.response.status}`;
    }
    return error instanceof Error ? error.message : 'Unknown error';
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

function hasMessage(body: unknown): body is { message: string } {
    return typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string';
}
