import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

export const PUBLORA_API_URL = 'https://api.publora.com/api/v1';

export type PubloraApiCallParams = {
  apiKey: string;
  method: HttpMethod;
  resourceUri: string;
  query?: QueryParams;
  body?: unknown;
};

export async function publoraApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  resourceUri,
  query,
  body,
}: PubloraApiCallParams): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${PUBLORA_API_URL}${resourceUri}`,
    headers: {
      'x-publora-key': apiKey,
      'Content-Type': 'application/json',
    },
    queryParams: query,
    body,
  });

  return response.body;
}

export type PubloraConnection = {
  platformId: string;
  username: string;
  profileImageUrl?: string;
  profileUrl?: string;
  tokenStatus: 'valid' | 'expired' | 'invalid';
};

export type PubloraPost = {
  postGroupId: string;
  content: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'partially_published';
  scheduledTime?: string;
  createdAt: string;
  updatedAt: string;
  platforms: {
    platformId: string;
    platform: string;
    status: string;
  }[];
  mediaUrls: string[];
};

/**
 * Platform ids look like "linkedin-n20H8w1Omj" — the prefix is the network.
 */
export function platformOf(platformId: string): string {
  return platformId.split('-')[0] ?? '';
}

export async function listConnections(apiKey: string) {
  return publoraApiCall<{ connections: PubloraConnection[] }>({
    apiKey,
    method: HttpMethod.GET,
    resourceUri: '/platform-connections',
  });
}
