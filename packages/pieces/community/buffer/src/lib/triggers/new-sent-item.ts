import {
  createTrigger,
  Property,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { bufferAuth } from '../common/auth';
import {
  bufferProps,
  bufferQueries,
  BufferPost,
} from '../common/props';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof bufferAuth>,
  { organizationId: string; channelIds?: string[] }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue }) {
    const posts = await bufferQueries.fetchPosts({
      accessToken: auth.secret_text,
      organizationId: propsValue.organizationId,
      channelIds: propsValue.channelIds,
      statusFilter: (status) => status?.toLowerCase() === 'sent',
    });
    return posts.map((post) => ({
      epochMilliSeconds: post.sentAt
        ? new Date(post.sentAt).getTime()
        : post.createdAt
          ? new Date(post.createdAt).getTime()
          : 0,
      data: post,
    }));
  },
};

export const newSentItem = createTrigger({
  auth: bufferAuth,
  name: 'new_sent_item',
  displayName: 'New Sent Post',
  description: 'Triggers when a Buffer post is successfully published.',
  aiMetadata: {
    description:
      'Fires when a Buffer post is successfully published (status sent) to a connected channel in the selected organization, optionally limited to specific channels. Represents the sent post.',
  },
  type: TriggerStrategy.POLLING,
  props: {
    organizationId: bufferProps.organizationId(),
    channelIds: Property.MultiSelectDropdown<string, false, typeof bufferAuth>({
      auth: bufferAuth,
      displayName: 'Channels',
      description: 'Limit results to specific channels (optional).',
      required: false,
      refreshers: ['organizationId'],
      options: async ({ auth, organizationId }) => {
        if (!auth || !organizationId) {
          return {
            disabled: true,
            placeholder: 'Select an organization first.',
            options: [],
          };
        }
        try {
          const channels = await bufferQueries.fetchChannels(
            auth.secret_text,
            organizationId as string,
          );
          return {
            disabled: false,
            options: channels.map((channel) => ({
              label: `${channel.name} (${channel.service})`,
              value: channel.id,
            })),
          };
        } catch {
          return {
            disabled: true,
            placeholder: 'Failed to load channels.',
            options: [],
          };
        }
      },
    }),
  },
  sampleData: {
    id: 'post_id_example',
    text: 'Hello from Buffer!',
    status: 'sent',
    createdAt: '2026-05-25T10:00:00.000Z',
    sentAt: '2026-05-25T18:00:00.000Z',
    channelId: 'channel_id',
    channelService: 'facebook',
    channel: { id: 'channel_id', name: 'My Page', service: 'facebook' },
    tags: [],
  } satisfies BufferPost,
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
