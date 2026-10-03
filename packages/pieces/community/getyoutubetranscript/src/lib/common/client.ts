import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

export const getYoutubeTranscriptBaseUrl = 'https://getyoutubetranscript.com/api/v1';

/**
 * GET helper for the GetYouTubeTranscript REST API. Empty or undefined query
 * values are dropped so optional props never send blank parameters.
 * Responses look like { success, data }; this returns `data`.
 */
export async function getYoutubeTranscriptRequest<T>(
  apiKey: string,
  path: string,
  query: Record<string, string | undefined> = {}
): Promise<T> {
  const queryParams: QueryParams = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      queryParams[key] = value;
    }
  }

  const response = await httpClient.sendRequest<{ success: boolean; data: T }>({
    method: HttpMethod.GET,
    url: `${getYoutubeTranscriptBaseUrl}${path}`,
    headers: { Authorization: `Bearer ${apiKey}` },
    queryParams,
  });

  return response.body.data;
}
