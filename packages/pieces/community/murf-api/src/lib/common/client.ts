import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const BASE_URL = "https://api.murf.ai/v1";

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
  isFormData = false
) {
  try {
    const headers: Record<string, string> = {
      "api-key": apiKey,
    };

    // Only set JSON Content-Type if not sending FormData
    let requestBody = body;
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    } else {
      // If body is FormData, let the httpClient handle Content-Type automatically
      requestBody = body;
    }

    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers,
      body: requestBody,
    });

    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${JSON.stringify(error.response || error)}`);
  }
}
