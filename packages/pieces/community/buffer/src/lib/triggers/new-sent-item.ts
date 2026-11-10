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
import { bufferProps, bufferFetch, BufferPost } from '../common/props';
import { postTriggerOutputSchema } from '../common/output-schemas';

const LOOKBACK_MS = 24 * 60 * 60 * 1000;

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof bufferAuth>,
  { organizationId: string; channelIds?: string[] }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue, lastFetchEpochMS }) {
    const posts = await bufferFetch.fetchNewPosts({
      accessToken: auth.secret_text,
      organizationId: propsValue.organizationId,
      channelIds: propsValue.channelIds,
      statuses: ['sent'],
      sortField: 'dueAt',
      windowField: 'dueAt',
      windowStart: lastFetchEpochMS > 0 ? new Date(lastFetchEpochMS - LOOKBACK_MS).toISOString() : undefined,
      firstPageOnly: lastFetchEpochMS <= 0,
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
  classification: 'READ',
  displayName: 'New Sent Post',
  description: 'Triggers when a Buffer post is successfully published. Each check usually uses one Buffer API request (one more per 100 posts sent in the last 24 hours), which counts against your plan limit (Free: 600 a day).',
  aiMetadata: {
    description:
      'Fires once per Buffer post that was published (status sent) in the selected organization, optionally limited to specific channels. Represents the sent post; posts whose scheduled time is more than a day before they were sent are not picked up.',
  },
  type: TriggerStrategy.POLLING,
  props: {
    organizationId: bufferProps.organizationId(),
    channelIds: bufferProps.channelFilter(),
  },
  outputSchema: postTriggerOutputSchema,
  sampleData: {
    id: 'post_id_example',
    text: 'Hello from Buffer!',
    status: 'sent',
    createdAt: '2026-05-25T10:00:00.000Z',
    updatedAt: '2026-05-25T18:00:05.000Z',
    dueAt: '2026-05-25T18:00:00.000Z',
    sentAt: '2026-05-25T18:00:04.000Z',
    channelId: 'channel_id',
    channelService: 'facebook',
    channel: { id: 'channel_id', name: 'My Page', service: 'facebook' },
    tags: [],
  } satisfies BufferPost,
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
