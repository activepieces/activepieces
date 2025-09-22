import {
    AuthenticationType,
    httpClient,
    HttpMethod,
    HttpRequest,
} from '@activepieces/pieces-common';

const capsuleCrmApiUrl = 'https://api.capsulecrm.com/api/v2';

/**
 * Makes an authenticated request to the Capsule CRM API using a Personal Access Token.
 * @param auth The user's Personal Access Token.
 * @param method The HTTP method to use.
 * @param url The API endpoint path (e.g., '/parties').
 * @param body The request body for POST/PATCH requests.
 * @returns The response body from the API.
 */
export async function makeRequest<T = Record<string, unknown>>(
    auth: string,
    method: HttpMethod,
    url: string,
    body?: object,
    queryParams?: Record<string, string | number | boolean>
): Promise<T> {
    const request: HttpRequest = {
        method: method,
        url: `${capsuleCrmApiUrl}${url}`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth,
        },
        body: body,
        queryParams: queryParams as Record<string, string>,
    };

    const { body: responseBody } = await httpClient.sendRequest<T>(request);
    return responseBody;
}
