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
  // LAST_ITEM is correct here: we want to fire when a post is newly created/scheduled,
  // not when its scheduled time arrives. TIMEBASED with scheduledSendTime would fire
  // based on due-time, causing posts scheduled for earlier dates to be missed.
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth }) => {
    const response = await hootsuiteApiCall<MessagesResponse>({
      auth,
      method: HttpMethod.GET,
      path: '/messages',
      queryParams: {
        state: 'SCHEDULED',
        limit: '50',
      },
    });

    return (response.body.data ?? [])
      .sort((a, b) => new Date(b.scheduledSendTime).getTime() - new Date(a.scheduledSendTime).getTime())
      .map((msg) => ({
        id: msg.id,
        data: {
          id: msg.id,
          state: msg.state,
          scheduled_send_time: msg.scheduledSendTime,
          text: msg.text ?? null,
          social_profile_ids: (msg.socialProfileIds ?? []).join(', '),
        },
      }));
  },
};

export const newScheduledPostTrigger = createTrigger({
  auth: hootsuiteAuth,
  name: 'new_scheduled_post',
  displayName: 'New Scheduled Post',
  description: 'Triggers when a new post is scheduled in Hootsuite.',
  aiMetadata: {
    description: 'Fires when a new post enters the SCHEDULED state in Hootsuite, representing content queued for future publishing. Fires at scheduling time, not when the post actually sends.',
  },
  props: {},
  sampleData: {
    id: 'msg_abc123',
    state: 'SCHEDULED',
    scheduled_send_time: '2024-06-01T10:00:00Z',
    text: 'Check out our latest blog post!',
    social_profile_ids: 'profile_1, profile_2',
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

type ScheduledMessage = {
  id: string;
  state: string;
  scheduledSendTime: string;
  text?: string;
  socialProfileIds?: string[];
};

type MessagesResponse = {
  data: ScheduledMessage[];
};
