import { HttpMethod, httpClient, HttpRequest } from "@activepieces/pieces-common";

export const BASE_URL = "https://viralapi.vadoo.tv/api";

/**
 * A helper function to make authenticated requests to the Vadoo AI API.
 *
 * @param apiKey The API key for authentication.
 * @param method The HTTP method (GET, POST, etc.).
 * @param path The API endpoint path (e.g., /generate_video).
 * @param body The request body for POST/PUT requests.
 * @param queryParams The URL query parameters for GET requests.
 * @returns The response body from the API.
 */
export async function makeRequest<T extends object>(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: object,
  queryParams?: Record<string, string>
): Promise<T> {

  const request: HttpRequest = {
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: body,
    queryParams: queryParams,
  };

  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (error: any) {
    // Re-throw a more helpful error message
    throw new Error(
      `Vadoo AI API request failed: ${JSON.stringify(
        error.response?.body || error.message || error
      )}`
    );
  }
}