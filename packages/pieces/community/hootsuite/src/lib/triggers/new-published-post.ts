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
import { hootsuiteAuth } from '../auth';
import { hootsuiteApiCall } from '../common';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof hootsuiteAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const response = await hootsuiteApiCall<MessagesResponse>({
      auth,
      method: HttpMethod.GET,
      path: '/messages',
      queryParams: {
        state: 'SENT',
        limit: '50',
      },
    });

    return (response.body.data ?? [])
      .filter((msg): msg is PublishedMessage & { sendTime: string } => !!msg.sendTime)
      .map((msg) => ({
        epochMilliSeconds: new Date(msg.sendTime).getTime(),
        data: {
          id: msg.id,
          state: msg.state,
          send_time: msg.sendTime,
          text: msg.text ?? null,
          post_url: msg.postUrl ?? null,
          social_profile_ids: (msg.socialProfileIds ?? []).join(', '),
        },
      }));
  },
};

export const newPublishedPostTrigger = createTrigger({
  auth: hootsuiteAuth,
  name: 'new_published_post',
  displayName: 'New Published Post',
  description: 'Triggers when a post is published (sent) in Hootsuite.',
  props: {},
  sampleData: {
    id: 'msg_xyz456',
    state: 'SENT',
    send_time: '2024-06-01T10:00:00Z',
    text: 'Check out our latest blog post!',
    post_url: 'https://twitter.com/example/status/123456',
    social_profile_ids: 'profile_1',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return pollingHelper.poll(polling, context);
  },
});

type PublishedMessage = {
  id: string;
  state: string;
  sendTime?: string;
  text?: string;
  postUrl?: string;
  socialProfileIds?: string[];
};

type MessagesResponse = {
  data: PublishedMessage[];
};
