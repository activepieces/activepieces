import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const BASE_URL = "https://api.webscraping.ai";

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  queryParams?: Record<string, string>,
  body?: unknown
) {
  try {
    let url = `${BASE_URL}${path}?api_key=${encodeURIComponent(apiKey)}`;

    if (queryParams) {
      const query = new URLSearchParams(queryParams).toString();
      url += `&${query}`;
    }

    const response = await httpClient.sendRequest({
      method,
      url,
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}
