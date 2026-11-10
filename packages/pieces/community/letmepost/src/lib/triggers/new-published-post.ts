import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import { letmepostAuth, LetmepostAuth } from '../common/auth';
import { letmepostClient } from '../common/client';
import { newPublishedPostOutputSchema } from '../common/output-schemas';

async function fetchPublishedPosts({ auth }: { auth: LetmepostAuth }): Promise<Record<string, unknown>[]> {
  const posts: Record<string, unknown>[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const body = await letmepostClient.request<{ data?: unknown; nextCursor?: unknown }>({
      auth,
      method: HttpMethod.GET,
      path: '/v1/posts',
      query: { status: 'published', limit: PAGE_SIZE, cursor },
      operation: 'list published posts',
    });
    const data = Array.isArray(body?.data) ? body.data.filter(letmepostClient.isRecord) : [];
    posts.push(...data);
    const next = letmepostClient.optionalText(body?.nextCursor);
    if (data.length === 0 || next === undefined || seenCursors.has(next)) {
      break;
    }
    seenCursors.add(next);
    cursor = next;
  }
  return posts;
}

function toItem(post: Record<string, unknown>) {
  const account = letmepostClient.isRecord(post['account']) ? post['account'] : {};
  const publishedAt = typeof post['publishedAt'] === 'string' ? post['publishedAt'] : null;
  const createdAt = typeof post['createdAt'] === 'string' ? post['createdAt'] : null;
  const epoch = new Date(publishedAt ?? createdAt ?? 0).getTime();
  return {
    epochMilliSeconds: Number.isNaN(epoch) ? 0 : epoch,
    data: {
      id: post['id'],
      account_id: post['accountId'],
      platform: post['platform'],
      status: post['status'],
      text: post['text'],
      published_at: publishedAt,
      platform_url: post['platformUri'] ?? null,
      platform_cid: post['platformCid'] ?? null,
      profile_id: post['profileId'] ?? null,
      account_display_name: account['displayName'] ?? null,
      scheduled_at: post['scheduledAt'] ?? null,
      created_at: createdAt,
    },
  };
}

const MAX_PAGES = 5;
const PAGE_SIZE = 200;

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof letmepostAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const posts = await fetchPublishedPosts({ auth });
    return posts.filter((post) => post['status'] === 'published').map(toItem);
  },
};

export const newPublishedPost = createTrigger({
  auth: letmepostAuth,
  name: 'new_published_post',
  classification: 'READ',
  displayName: 'New Published Post',
  description: 'Triggers when a post is published',
  aiMetadata: {
    description:
      'Fires once per post that reaches the published state, emitting the post id, account, platform, text, publish time and the platform URI. Polls the 1,000 most recently created published posts, so a post scheduled long before many newer posts can be missed; use Post Event for instant, complete delivery.',
  },
  props: {},
  sampleData: {
    id: '0193f1d2-7c1e-7a4b-9d1e-2f6a8b3c4d5e',
    account_id: '0193f1d2-1a2b-7c3d-8e4f-5a6b7c8d9e0f',
    account_display_name: 'letmepost.dev',
    profile_id: '0193f1d2-0000-7a4b-9d1e-2f6a8b3c4d5e',
    platform: 'bluesky',
    status: 'published',
    text: 'Shipped multi-target publishing today.',
    published_at: '2026-06-18T10:00:00.000Z',
    scheduled_at: null,
    created_at: '2026-06-18T09:59:58.000Z',
    platform_url: 'at://did:plc:abc123/app.bsky.feed.post/3kxyz',
    platform_cid: 'bafyreib2rxk3rh6kzwq',
  },
  outputSchema: newPublishedPostOutputSchema,
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
