import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { antworkAuth, ANTWORK_API_BASE } from '../auth';

export { ANTWORK_API_BASE };

const PLATFORM_NAMES: Record<string, string> = {
  x: 'X (Twitter)',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  threads: 'Threads',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  pinterest: 'Pinterest',
  bluesky: 'Bluesky',
  discord: 'Discord',
  mastodon: 'Mastodon',
  telegram: 'Telegram',
  google_business: 'Google Business Profile',
};

export function platformName(id: string | undefined): string {
  if (!id) return 'Unknown';
  return PLATFORM_NAMES[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
}

export async function antworkApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  path,
  body,
  queryParams,
  idempotencyKey,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
  idempotencyKey?: string;
}): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method,
    url: `${ANTWORK_API_BASE}${path}`,
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    queryParams,
    body,
  });
}

type Workspace = { id: string; name: string };
type Account = {
  id: string;
  name: string;
  handle?: string | null;
  platform: string;
  active?: boolean;
};

export const antworkCommon = {
  workspace: (required: boolean) =>
    Property.Dropdown({
      displayName: 'Workspace',
      description: required
        ? 'The Antwork workspace (brand) the post belongs to.'
        : 'Leave empty for every workspace.',
      refreshers: [],
      required,
      auth: antworkAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, options: [], placeholder: 'Connect your Antwork account first' };
        }
        const response = await antworkApiCall<{ workspaces: Workspace[] }>({
          apiKey: auth.secret_text,
          method: HttpMethod.GET,
          path: '/workspaces',
        });
        return {
          disabled: false,
          options: response.body.workspaces.map((w) => ({ label: w.name, value: w.id })),
        };
      },
    }),
  account: (required: boolean) =>
    Property.Dropdown({
      displayName: 'Social Account',
      description: required
        ? 'One account per post. For several accounts, add one step per account, each with copy written for that platform.'
        : 'Leave empty for every account.',
      refreshers: ['workspace'],
      required,
      auth: antworkAuth,
      options: async ({ auth, workspace }) => {
        if (!auth) {
          return { disabled: true, options: [], placeholder: 'Connect your Antwork account first' };
        }
        const response = await antworkApiCall<{ accounts: Account[] }>({
          apiKey: auth.secret_text,
          method: HttpMethod.GET,
          path: '/accounts',
          queryParams: workspace ? { workspaceId: workspace as string } : undefined,
        });
        return {
          disabled: false,
          options: response.body.accounts
            .filter((a) => a.active !== false)
            .map((a) => ({
              label: `${platformName(a.platform)} · ${a.name}${a.handle ? ` (@${a.handle.replace(/^@/, '')})` : ''}`,
              value: a.id,
            })),
        };
      },
    }),
  /**
   * Recent posts to pick from, so nobody types an id. In a flow the value is
   * usually mapped from Create Draft Post's `id` instead.
   */
  post: (status?: 'draft' | 'scheduled' | 'published' | 'failed') =>
    Property.Dropdown({
      displayName: 'Post',
      description: status
        ? `Pick one of your recent ${status} posts, or map the id returned by Create Draft Post.`
        : 'Pick one of your recent posts, or map a post id from an earlier step.',
      refreshers: [],
      required: true,
      auth: antworkAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, options: [], placeholder: 'Connect your Antwork account first' };
        }
        const response = await antworkApiCall<{ posts: RecentPost[] }>({
          apiKey: auth.secret_text,
          method: HttpMethod.GET,
          path: '/posts',
          queryParams: { limit: '50', ...(status ? { status } : {}) },
        });
        return {
          disabled: false,
          options: response.body.posts.map((p) => {
            const text = (p.text ?? '').replace(/\s+/g, ' ').trim();
            const snippet = text.length > 60 ? `${text.slice(0, 57)}...` : text || '(no text)';
            return { label: `${platformName(p.platform)} · ${snippet}`, value: p.id };
          }),
        };
      },
    }),
};

type RecentPost = { id: string; platform: string; text: string | null; status: string };

/**
 * Deterministic Idempotency-Key for a mutating call, so a retried step gets the
 * first answer back instead of a second draft or a second publish. FNV-1a over
 * the run id, action and body; no crypto import needed.
 */
export function idempotencyKey(runId: string, action: string, body: unknown): string {
  const input = `${runId}:${action}:${JSON.stringify(body)}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x5bd1e995;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x01000197) >>> 0;
  }
  return `activepieces-${action}-${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
}
