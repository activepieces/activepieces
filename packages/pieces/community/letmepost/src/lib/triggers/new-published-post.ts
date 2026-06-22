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
import { letmepostAuth } from '../common/auth';
import { letmepostApiCall } from '../common';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof letmepostAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const response = await letmepostApiCall<{
      data: {
        id: string;
        accountId: string;
        platform: string;
        status: string;
        text: string;
        publishedAt: string | null;
        platformUri: string | null;
        createdAt: string;
      }[];
    }>({
      auth: auth,
      method: HttpMethod.GET,
      path: '/v1/posts',
      queryParams: { limit: '100' },
    });

    return response.body.data
      .filter((post) => post.status === 'published')
      .map((post) => ({
        epochMilliSeconds: new Date(
          post.publishedAt ?? post.createdAt,
        ).getTime(),
        data: {
          id: post.id,
          account_id: post.accountId,
          platform: post.platform,
          status: post.status,
          text: post.text,
          published_at: post.publishedAt,
          platform_url: post.platformUri,
        },
      }));
  },
};

export const newPublishedPost = createTrigger({
  auth: letmepostAuth,
  name: 'new_published_post',
  displayName: 'New Published Post',
  description: 'Triggers when a post is published',
  aiMetadata: {
    description:
      'Fires when a post reaches the published state, emitting the post id, account, platform, text, publish time, and the resulting platform URL. Use to react to content going live, for example to log it or notify a channel. Polls recent posts and emits each newly published one.',
  },
  props: {},
  sampleData: {
    id: 'post_01HXY7Z8K9MNB1P2QR3STVW',
    account_id: 'acc_01HXY7Z8K9MNB1P2QR3STVW',
    platform: 'bluesky',
    status: 'published',
    text: 'Shipped multi-target publishing today.',
    published_at: '2026-06-18T10:00:00.000Z',
    platform_url: 'https://bsky.app/profile/letmepost.dev/post/abc123',
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
