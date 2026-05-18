import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const BASE_URL = `https://api.agentx.so/api/v1/access`;

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        "x-api-key": apiKey,            
        "Content-Type": "application/json",
        Accept: "application/json",     
      },
      body,
    });
    return response.body;
  } catch (error: any) {
    throw new Error(`AgentX API error: ${error.message || String(error)}`);
  }
}
