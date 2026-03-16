import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export async function graphRequest<T>(
  apiToken: string,
  path: string,
  queryParams: Record<string, string> = {}
): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method: HttpMethod.GET,
      url: `https://token-api.thegraph.com${path}`,
      queryParams: Object.fromEntries(
        Object.entries(queryParams).filter(([, v]) => Boolean(v))
      ),
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json',
      },
    });
    return response.body;
  } catch (err: unknown) {
    const httpErr = err as { response?: { body?: unknown; status?: number; statusText?: string } };
    if (httpErr?.response?.body) {
      throw new Error(
        `The Graph API error (${httpErr.response.status}): ${JSON.stringify(httpErr.response.body)}`
      );
    }
    throw err;
  }
}
