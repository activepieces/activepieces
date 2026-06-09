import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { bufferAuth } from '../common/auth';
import { bufferProps, bufferQueries, Channel } from '../common/props';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof bufferAuth>,
  { organizationId: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue }) {
    const channels = await bufferQueries.fetchChannels(
      auth.secret_text,
      propsValue.organizationId,
    );
    return channels.map((channel) => ({
      epochMilliSeconds: channel.createdAt
        ? new Date(channel.createdAt).getTime()
        : 0,
      data: channel,
    }));
  },
};

export const newChannel = createTrigger({
  auth: bufferAuth,
  name: 'new_channel',
  displayName: 'New Channel',
  description: 'Triggers when a new channel is connected to your Buffer organization.',
  type: TriggerStrategy.POLLING,
  props: {
    organizationId: bufferProps.organizationId(),
  },
  sampleData: {
    id: 'channel_id_example',
    name: 'My Page',
    service: 'facebook',
    organizationId: 'org_id_example',
    createdAt: '2026-05-25T10:00:00.000Z',
  } satisfies Channel,
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
});
