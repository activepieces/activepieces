import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { BpPost, bulkpublishAuth, listPosts } from '../common';

const SAMPLE: BpPost = {
  id: 12345,
  content: 'Hello from BulkPublish!',
  status: 'published',
  scheduledAt: '2026-10-12T10:00:00.000Z',
  timezone: 'UTC',
  postFormat: 'post',
  createdAt: '2026-10-12T09:00:00.000Z',
  publishedAt: '2026-10-12T10:00:05.000Z',
  postPlatforms: [
    { id: 1, channelId: 7, platform: 'x', status: 'published', platformPostId: '1845', platformUrl: 'https://x.com/i/status/1845', errorMessage: null, retryCount: 0 },
  ],
};

const SEEN_KEY = 'bp_seen_post_ids';
const MAX_SEEN = 2000;

/**
 * Polls GET /api/posts?status=<status>&limit=100. The API has no webhooks, no sort parameter and no
 * "status changed since" filter, so we dedupe by post ID in the trigger store: on enable we record the
 * IDs currently in that status (no backfill), and each poll emits IDs we have not seen before.
 * A post that leaves and re-enters the status (e.g. failed -> retried -> failed) will not fire twice.
 */
export function makePostStatusTrigger(opts: {
  name: string;
  displayName: string;
  description: string;
  status: string;
  sampleStatus: string;
}) {
  return createTrigger({
    auth: bulkpublishAuth,
    name: opts.name,
    displayName: opts.displayName,
    description: opts.description,
    props: {},
    type: TriggerStrategy.POLLING,
    sampleData: { ...SAMPLE, status: opts.sampleStatus },
    async onEnable(context) {
      const posts = await listPosts(context.auth.secret_text, opts.status, 100);
      await context.store.put<number[]>(SEEN_KEY, posts.map((p) => p.id));
    },
    async onDisable(context) {
      await context.store.delete(SEEN_KEY);
    },
    async run(context) {
      const seen = new Set((await context.store.get<number[]>(SEEN_KEY)) ?? []);
      const posts = await listPosts(context.auth.secret_text, opts.status, 100);
      const fresh = posts.filter((p) => !seen.has(p.id));
      if (fresh.length) {
        const merged = [...fresh.map((p) => p.id), ...seen].slice(0, MAX_SEEN);
        await context.store.put<number[]>(SEEN_KEY, merged);
      }
      return fresh;
    },
    async test(context) {
      return listPosts(context.auth.secret_text, opts.status, 5);
    },
  });
}
