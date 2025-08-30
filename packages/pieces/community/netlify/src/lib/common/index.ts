import { httpClient, HttpMethod, AuthenticationType, HttpRequest, QueryParams } from "@activepieces/pieces-common";
import { OAuth2PropertyValue } from "@activepieces/pieces-framework";


export const NETLIFY_API_URL = "https://api.netlify.com/api/v1";

/**
 * A common function to make authenticated API calls to Netlify.
 * @param method The HTTP method (GET, POST, etc.)
 * @param endpoint The API endpoint to call (e.g., 'sites')
 * @param auth The OAuth2 authentication property containing the access token
 * @param body The request body for POST/PUT requests
 * @param queryParams The query parameters for the request
 * @returns The response body from the API call
 */
export const callNetlifyApi = <T>(
    method: HttpMethod,
    endpoint: string,
    auth: OAuth2PropertyValue,
    body?: object,
    queryParams?: QueryParams, 
): Promise<T> => {
    const request: HttpRequest = {
        method: method,
        url: `${NETLIFY_API_URL}/${endpoint}`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth.access_token,
        },
        body: body,
        queryParams: queryParams, 
    };

    
    return httpClient.sendRequest<T>(request).then(response => response.body);
};