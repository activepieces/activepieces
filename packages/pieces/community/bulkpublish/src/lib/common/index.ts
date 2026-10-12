import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const BULKPUBLISH_BASE_URL = 'https://app.bulkpublish.com';

export const bulkpublishAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Create an API key in BulkPublish under **Settings > API Keys**. It starts with `bp_`.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await bpRequest(auth, HttpMethod.GET, '/api/channels');
      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'Invalid API key, or BulkPublish could not be reached.' };
    }
  },
});

export async function bpRequest<T extends HttpMessageBody = HttpMessageBody>(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
  queryParams?: QueryParams
): Promise<T> {
  const res = await httpClient.sendRequest<T>({
    method,
    url: `${BULKPUBLISH_BASE_URL}${path}`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token: apiKey },
    headers: { 'Content-Type': 'application/json' },
    body,
    queryParams,
  });
  return res.body;
}

export interface BpPost {
  id: number;
  status: string;
  content?: string;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  [key: string]: unknown;
}

export async function listPosts(apiKey: string, status: string, limit = 100): Promise<BpPost[]> {
  const res = await bpRequest<{ posts: BpPost[] }>(apiKey, HttpMethod.GET, '/api/posts', undefined, {
    status,
    limit: String(limit),
    page: '1',
  });
  return res.posts ?? [];
}

export const channelsDropdown = (required: boolean) =>
  Property.MultiSelectDropdown({
    auth: bulkpublishAuth,
    displayName: 'Channels',
    description: 'Connected social accounts to post to.',
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your BulkPublish account first' };
      }
      const res = await bpRequest<{ channels: { id: number; platform: string; accountName: string }[] }>(
        auth.secret_text,
        HttpMethod.GET,
        '/api/channels'
      );
      return {
        disabled: false,
        options: (res.channels ?? []).map((c) => ({
          label: `${c.accountName} (${c.platform})`,
          value: c.id,
        })),
      };
    },
  });

export const postIdProp = Property.Number({
  displayName: 'Post ID',
  description: 'The numeric BulkPublish post ID.',
  required: true,
});
