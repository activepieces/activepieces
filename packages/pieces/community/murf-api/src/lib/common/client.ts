import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const BASE_URL = `https://api.murf.ai/v1`;

type MurfAuth = {
  murfApiKey: string;
  murfDubApiKey: string;
};

/**
 * Makes a request to Murf API or MurfDub API
 * @param auth - The auth object from murfAuth
 * @param method - GET, POST, etc.
 * @param path - API endpoint path (e.g. "/speech/voices")
 * @param body - Optional body for POST/PUT
 * @param queryParams - Optional query params
 * @param useDubKey - If true, uses murfDubApiKey instead of murfApiKey
 */
export async function makeRequest(
  auth: MurfAuth,
  method: HttpMethod,
  path: string,
  body?: unknown,
  queryParams?: Record<string, string | number | boolean>,
  useDubKey = false
) {
  const apiKey = useDubKey ? auth.murfDubApiKey : auth.murfApiKey;

  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        "api-key": apiKey, // ✅ Murf expects `api-key`, not `Authorization`
        "Content-Type": "application/json",
      },
      body,
      queryParams: queryParams
        ? Object.fromEntries(
            Object.entries(queryParams).map(([k, v]) => [k, String(v)])
          )
        : undefined,
    });

    return response.body;
  } catch (error: any) {
    throw new Error(
      `Murf API request failed: ${error.message || JSON.stringify(error)}`
    );
  }
}
