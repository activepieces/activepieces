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
import { postizAuth, PostizAuth } from '../common/auth';
import { postizApiCall } from '../common';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof postizAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const response = await postizApiCall<{
      posts: {
        id: string;
        content: string;
        publishDate: string;
        releaseURL: string;
        state: string;
        integration: {
          id: string;
          providerIdentifier: string;
          name: string;
          picture: string;
        };
      }[];
    }>({
      auth: auth as PostizAuth,
      method: HttpMethod.GET,
      path: '/posts',
      queryParams: {
        startDate: thirtyDaysAgo.toISOString(),
        endDate: now.toISOString(),
      },
    });

    return response.body.posts
      .filter((post) => post.state === 'PUBLISHED')
      .map((post) => ({
        epochMilliSeconds: new Date(post.publishDate).getTime(),
        data: {
          id: post.id,
          content: post.content,
          publish_date: post.publishDate,
          release_url: post.releaseURL ?? null,
          state: post.state,
          integration_id: post.integration?.id ?? null,
          integration_provider: post.integration?.providerIdentifier ?? null,
          integration_name: post.integration?.name ?? null,
        },
      }));
  },
};

export const newPost = createTrigger({
  auth: postizAuth,
  name: 'new_post',
  displayName: 'New Published Post',
  description: 'Triggers when a post is published in Postiz',
  props: {},
  sampleData: {
    id: 'abc123',
    content: 'Hello world! Check out our latest update.',
    publish_date: '2024-12-15T10:00:00.000Z',
    release_url: 'https://x.com/user/status/123456',
    state: 'PUBLISHED',
    integration_id: 'int_123',
    integration_provider: 'x',
    integration_name: 'My X Account',
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
