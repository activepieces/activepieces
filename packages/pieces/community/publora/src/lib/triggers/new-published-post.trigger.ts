import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import { publoraAuth } from '../auth';
import { publoraApiCall, PubloraPost } from '../common/client';

const polling: Polling<string, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const response = await publoraApiCall<{ posts: PubloraPost[] }>({
      apiKey: auth,
      method: HttpMethod.GET,
      resourceUri: '/list-posts',
      query: {
        status: 'published',
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        limit: '100',
        ...(lastFetchEpochMS > 0
          ? { fromDate: new Date(lastFetchEpochMS).toISOString() }
          : {}),
      },
    });

    return response.posts.map((post) => ({
      // A post is published per platform, so its delivery time is the last
      // update rather than the time it was scheduled.
      epochMilliSeconds: new Date(post.updatedAt).getTime(),
      data: post,
    }));
  },
};

export const newPublishedPostTrigger = createTrigger({
  auth: publoraAuth,
  name: 'new_published_post',
  displayName: 'New Published Post',
  description: 'Fires when a post has been published to a social account.',
  props: {},
  sampleData: {
    postGroupId: '6a69d9249cb8bda13a0c7be3',
    content: 'Summer drop is live — three new colourways.',
    status: 'published',
    scheduledTime: '2026-07-29T10:44:40.516Z',
    createdAt: '2026-07-29T10:42:44.932Z',
    updatedAt: '2026-07-29T10:51:33.547Z',
    platforms: [
      {
        platformId: 'linkedin-n20H8w1Omj',
        platform: 'linkedin',
        status: 'published',
      },
    ],
    mediaUrls: [],
  },
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
