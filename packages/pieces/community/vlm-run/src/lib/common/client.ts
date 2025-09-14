import { HttpMethod, httpClient, HttpRequest } from "@activepieces/pieces-common";

export const BASE_URL = "https://api.vlm.run/v1";

/**
 * A helper function to make authenticated requests to the VLM-run API.
 * @param apiKey The user's API key for authentication.
 * @param method The HTTP method (GET, POST, etc.).
 * @param path The API endpoint path (e.g., "/generate").
 * @param body The request body for POST/PUT requests.
 * @returns The response body from the API.
 */
export async function makeRequest<T = any>(
    apiKey: string,
    method: HttpMethod,
    path: string,
    body?: any
): Promise<T> {
    const request: HttpRequest = {
        method,
        url: `${BASE_URL}${path}`,
        headers: {
            // Corrected to use Bearer token authorization
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: body,
    };

    try {
        const response = await httpClient.sendRequest<T>(request);
        return response.body;
    } catch (error: any) {
        throw new Error(
            `Error making API request: ${JSON.stringify(error?.response?.body || error?.message || error)}`
        );
    }
}