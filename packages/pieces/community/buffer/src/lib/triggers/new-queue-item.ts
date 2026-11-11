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
    const posts = await loadQueuedPosts({ auth, propsValue, lastPoll: lastFetchEpochMS });
    return posts.map((post) => ({ epochMilliSeconds: createdEpoch(post), data: post }));
  },
};

function loadQueuedPosts({
  auth,
  propsValue,
  lastPoll,
}: {
  auth: AppConnectionValueForAuthProperty<typeof bufferAuth>;
  propsValue: { organizationId: string; channelIds?: string[] };
  lastPoll: number;
}): Promise<BufferPost[]> {
  return bufferFetch.fetchNewPosts({
    accessToken: auth.secret_text,
    organizationId: propsValue.organizationId,
    channelIds: propsValue.channelIds,
    statuses: QUEUED_STATUSES,
    sortField: 'createdAt',
    sortDirection: lastPoll > 0 ? 'asc' : 'desc',
    windowField: 'createdAt',
    windowStart: lastPoll > 0 ? new Date(lastPoll - 1).toISOString() : undefined,
    firstPageOnly: lastPoll <= 0,
  });
}

function createdEpoch(post: BufferPost): number {
  return post.createdAt ? new Date(post.createdAt).getTime() : 0;
}

export const newQueueItem = createTrigger({
  auth: bufferAuth,
  name: 'new_queue_item',
  classification: 'READ',
  displayName: 'New Queue Item',
  description: 'Triggers when a new post is queued in Buffer. Each check usually uses one Buffer API request (one more per 100 matching posts, at most 10 per check; any left over are picked up on the next check), which counts against your plan limit (Free: 600 a day).',
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
    await bufferFetch.startPolling({ store: context.store, isRepublish: context.isRepublish });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await bufferFetch.pollNewPosts({
      store: context.store,
      loadPosts: (lastPoll) => loadQueuedPosts({ auth: context.auth, propsValue: context.propsValue, lastPoll }),
      epochOf: createdEpoch,
    });
  },
});
