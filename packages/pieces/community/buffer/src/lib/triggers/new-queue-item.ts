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

const QUEUED_STATUSES = ['draft', 'needs_approval', 'scheduled', 'sending'];

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
      statuses: QUEUED_STATUSES,
      sortField: 'createdAt',
      windowField: 'createdAt',
      windowStart: lastFetchEpochMS > 0 ? new Date(lastFetchEpochMS).toISOString() : undefined,
      firstPageOnly: lastFetchEpochMS <= 0,
    });
    return posts.map((post) => ({
      epochMilliSeconds: post.createdAt
        ? new Date(post.createdAt).getTime()
        : 0,
      data: post,
    }));
  },
};

export const newQueueItem = createTrigger({
  auth: bufferAuth,
  name: 'new_queue_item',
  classification: 'READ',
  displayName: 'New Queue Item',
  description: 'Triggers when a new post is queued in Buffer. Each check usually uses one Buffer API request (one more per 100 matching posts), which counts against your plan limit (Free: 600 a day).',
  aiMetadata: {
    description:
      'Fires once per newly created Buffer post that is not yet published (status draft, needs_approval, scheduled or sending) in the selected organization, optionally limited to specific channels. Represents the queued post.',
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
    status: 'scheduled',
    createdAt: '2026-05-25T10:00:00.000Z',
    updatedAt: '2026-05-25T10:00:00.000Z',
    dueAt: '2026-05-25T18:00:00.000Z',
    sentAt: null,
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
