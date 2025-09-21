import {
    AuthenticationType,
    httpClient,
    HttpMethod,
    HttpRequest,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

const capsuleCrmApiUrl = 'https://api.capsulecrm.com/api/v2';

/**
 * Makes an authenticated request to the Capsule CRM API.
 * @param auth The user's OAuth2 authentication object.
 * @param method The HTTP method to use.
 * @param url The API endpoint path (e.g., '/parties').
 * @param body The request body for POST/PATCH requests.
 * @returns The response body from the API.
 */
export async function makeRequest<T = Record<string, unknown>>(
    auth: OAuth2PropertyValue,
    method: HttpMethod,
    url: string,
    body?: object
): Promise<T> {
    const request: HttpRequest = {
        method: method,
        url: `${capsuleCrmApiUrl}${url}`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth.access_token,
        },
        body: body,
    };

    const { body: responseBody } = await httpClient.sendRequest<T>(request);
    return responseBody;
}