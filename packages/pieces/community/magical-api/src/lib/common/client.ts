import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const BASE_URL = "https://gw.magicalapi.com";

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: any
): Promise<any> {
  try {
    const headers: Record<string, string> = {
      "api-key": apiKey,
      "Content-Type": "application/json",
    };

    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers,
      body: body,
    });

    return response.body;
  } catch (error: any) {
    throw new Error(
      `MagicalAPI request failed: ${JSON.stringify(
        error.response?.body || error.message || error
      )}`
    );
  }
}