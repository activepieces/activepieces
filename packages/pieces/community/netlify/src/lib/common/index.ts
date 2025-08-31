import { httpClient, HttpMethod, HttpRequest, QueryParams } from "@activepieces/pieces-common";

/**
 * A helper function to make authenticated API calls to the Netlify API.
 * @param method The HTTP method (GET, POST, etc.)
 * @param endpoint The API endpoint to call (e.g., 'sites')
 * @param auth The user's Personal Access Token (a string)
 * @param body The request body for POST/PUT requests
 * @param queryParams The query parameters for the request
 * @returns The parsed JSON response from the API
 */
export const callNetlifyApi = async <T extends object>(
    method: HttpMethod,
    endpoint: string,
    auth: string,
    body?: object,
    queryParams?: QueryParams
): Promise<T> => {
    const request: HttpRequest = {
        method: method,
        url: `https://api.netlify.com/api/v1/${endpoint}`,
        headers: {
            Authorization: `Bearer ${auth}`,
        },
        body: body,
        queryParams: queryParams,
    };

    const response = await httpClient.sendRequest<T>(request);
    return response.body;
};

