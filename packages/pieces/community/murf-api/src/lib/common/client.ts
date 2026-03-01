import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const BASE_URL = "https://api.murf.ai/v1";

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: any,
  isFormData = false
) {
  try {
    let headers: Record<string, string> = {
      "api-key": apiKey,
    };

    const requestBody = body;

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    } else if (body && typeof (body as any).getHeaders === "function") {
      headers = { ...headers, ...(body as any).getHeaders() };
    }

    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers,
      body: requestBody,
    });

    return response.body;
  } catch (error: any) {
    throw new Error(
      `Unexpected error: ${JSON.stringify(error.response || error.message || error)}`
    );
  }
}
