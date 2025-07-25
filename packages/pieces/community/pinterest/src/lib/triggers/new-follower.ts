import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  PiecePropValueSchema,
  createTrigger,
} from '@activepieces/pieces-framework';
import { pinterestAuth } from '../common/auth';
import { pinterestApiCall } from '../common/client';

const polling: Polling<PiecePropValueSchema<typeof pinterestAuth>, {}> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const response = await pinterestApiCall({
      auth,
      method: HttpMethod.GET,
      url: '/user_account/followers',
    }) as { body: { items?: any[] } };

    const followers = response.body.items ?? [];

    return followers.map((follower: any) => {
      const createdTime = new Date(follower.following_since).getTime() || Date.now();
      return {
        epochMilliSeconds: createdTime,
        data: follower,
      };
    }).filter((entry) => entry.epochMilliSeconds > lastFetchEpochMS);
  },
};

export const newFollowerTrigger = createTrigger({
  name: 'new_follower',
  auth: pinterestAuth,
  displayName: 'New Follower',
  description: 'Triggers when a user gains a new follower.',
  props: {},
  type: TriggerStrategy.POLLING,

  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  sampleData: {
    username: 'new_follower_user',
    full_name: 'New Follower',
    image_medium_url: 'https://i.pinimg.com/images/profile.jpg',
    following_since: '2025-07-10T12:00:00Z',
  },
});
