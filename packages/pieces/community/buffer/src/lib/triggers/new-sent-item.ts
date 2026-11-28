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
    const posts = await loadSentPosts({ auth, propsValue, lastPoll: lastFetchEpochMS });
    return posts.map((post) => ({ epochMilliSeconds: sentEpoch(post), data: post }));
  },
};

function loadSentPosts({
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
    statuses: ['sent'],
    sortField: 'dueAt',
    sortDirection: 'desc',
    windowField: 'dueAt',
    windowStart: lastPoll > 0 ? new Date(lastPoll - LOOKBACK_MS).toISOString() : undefined,
    firstPageOnly: lastPoll <= 0,
  });
}

function sentEpoch(post: BufferPost): number {
  if (post.sentAt) {
    return new Date(post.sentAt).getTime();
  }
  return post.createdAt ? new Date(post.createdAt).getTime() : 0;
}

export const newSentItem = createTrigger({
  auth: bufferAuth,
  name: 'new_sent_item',
  classification: 'READ',
  displayName: 'New Sent Post',
  description: 'Triggers when a Buffer post is successfully published. Each check usually uses one Buffer API request (one more per 100 posts sent in the last 24 hours, at most 10 per check), which counts against your plan limit (Free: 600 a day). If more than 1,000 posts are sent in one day, only the 1,000 with the latest scheduled times are checked.',
  aiMetadata: {
    description:
      'Fires once per Buffer post that was published (status sent) in the selected organization, optionally limited to specific channels. Represents the sent post; posts whose scheduled time is more than a day before they were sent are not picked up, and when more than 1,000 posts were sent in that day only the 1,000 with the latest scheduled times are checked.',
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
      loadPosts: (lastPoll) => loadSentPosts({ auth: context.auth, propsValue: context.propsValue, lastPoll }),
      epochOf: sentEpoch,
    });
  },
});
