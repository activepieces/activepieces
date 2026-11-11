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
import { bufferProps, bufferFetch, Channel } from '../common/props';
import { channelTriggerOutputSchema } from '../common/output-schemas';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof bufferAuth>,
  { organizationId: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue }) {
    const channels = await bufferFetch.fetchChannels({
      accessToken: auth.secret_text,
      organizationId: propsValue.organizationId,
    });
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
  classification: 'READ',
  displayName: 'New Channel',
  description: 'Triggers when a new channel is connected to your Buffer organization. Each check uses one Buffer API request, which counts against your plan limit (Free: 600 a day).',
  aiMetadata: {
    description:
      'Fires when a new social media channel (e.g. a Facebook page, Instagram or X account) is connected to the selected Buffer organization, representing the newly linked channel.',
  },
  type: TriggerStrategy.POLLING,
  props: {
    organizationId: bufferProps.organizationId(),
  },
  outputSchema: channelTriggerOutputSchema,
  sampleData: {
    id: 'channel_id_example',
    name: 'My Page',
    displayName: 'My Page',
    service: 'facebook',
    organizationId: 'org_id_example',
    createdAt: '2026-05-25T10:00:00.000Z',
  } satisfies Channel,
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
