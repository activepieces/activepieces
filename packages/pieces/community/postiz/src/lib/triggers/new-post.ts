import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postizAuth } from '../common/auth';
import {
  mapPost,
  MappedPostizPost,
  postizApiCall,
  PostizAuth,
  PostizPost,
  postOutputFields,
} from '../common';

async function fetchPublishedPosts({
  auth,
  now,
}: {
  auth: PostizAuth;
  now: number;
}): Promise<MappedPostizPost[]> {
  const response = await postizApiCall<{ posts?: PostizPost[] }>({
    auth,
    method: HttpMethod.GET,
    path: '/posts',
    queryParams: {
      startDate: new Date(now - LOOKBACK_MS).toISOString(),
      endDate: new Date(now + LOOKAHEAD_MS).toISOString(),
    },
  });
  return (response.body?.posts ?? [])
    .filter((post) => post.state === 'PUBLISHED')
    .map((post) => mapPost({ post }))
    .sort(
      (a, b) =>
        toEpoch({ date: a.publish_date }) - toEpoch({ date: b.publish_date })
    );
}

function toEpoch({ date }: { date: string | null }): number {
  const epoch = date ? new Date(date).getTime() : 0;
  return Number.isNaN(epoch) ? 0 : epoch;
}

function selectNewPosts({
  posts,
  seenIds,
}: {
  posts: MappedPostizPost[];
  seenIds: string[];
}): { newPosts: MappedPostizPost[]; nextSeenIds: string[] } {
  const seen = new Set(seenIds);
  const newPosts = posts.filter((post) => !seen.has(post.id));
  const nextSeenIds = Array.from(new Set(posts.map((post) => post.id))).slice(
    -MAX_SEEN_IDS
  );
  return { newPosts, nextSeenIds };
}

const NEW_POST_SAMPLE = {
  id: 'abc123',
  content: 'Hello world! Check out our latest update.',
  publish_date: '2024-12-15T10:00:00.000Z',
  release_url: 'https://x.com/user/status/123456',
  state: 'PUBLISHED',
  error: null,
  integration_id: 'int_123',
  integration_provider: 'x',
  integration_name: 'My X Account',
};

export const newPost = createTrigger({
  auth: postizAuth,
  name: 'new_post',
  classification: 'READ',
  displayName: 'New Published Post',
  description: 'Triggers when a post is published in Postiz',
  aiMetadata: {
    description:
      'Fires when a post reaches the published state in Postiz, emitting the published post with its id, content, publish date, release URL, and the channel it went out on. Use to react to content going live (e.g. to log, notify, or fetch post analytics). Polls posts dated in the last 30 days and emits each published post once, even when publishing finished after an earlier poll.',
  },
  props: {},
  outputSchema: {
    fields: postOutputFields,
  },
  sampleData: NEW_POST_SAMPLE,
  type: TriggerStrategy.POLLING,
  async test(context) {
    const posts = await fetchPublishedPosts({
      auth: context.auth,
      now: Date.now(),
    });
    return posts.length === 0 ? [NEW_POST_SAMPLE] : posts.slice(-5).reverse();
  },
  async onEnable(context) {
    const posts = await fetchPublishedPosts({
      auth: context.auth,
      now: Date.now(),
    });
    const { nextSeenIds } = selectNewPosts({ posts, seenIds: [] });
    await context.store.put(SEEN_IDS_KEY, nextSeenIds);
  },
  async onDisable(context) {
    await context.store.delete(SEEN_IDS_KEY);
  },
  async run(context) {
    const stored = await context.store.get<string[]>(SEEN_IDS_KEY);
    const posts = await fetchPublishedPosts({
      auth: context.auth,
      now: Date.now(),
    });
    const { newPosts, nextSeenIds } = selectNewPosts({
      posts,
      seenIds: Array.isArray(stored) ? stored : [],
    });
    await context.store.put(SEEN_IDS_KEY, nextSeenIds);
    return Array.isArray(stored) ? newPosts : [];
  },
});

const LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;
const LOOKAHEAD_MS = 24 * 60 * 60 * 1000;
const MAX_SEEN_IDS = 5000;
const SEEN_IDS_KEY = 'postiz_new_post_seen_ids';

export { selectNewPosts, LOOKBACK_MS };
