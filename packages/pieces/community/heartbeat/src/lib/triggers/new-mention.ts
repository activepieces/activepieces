import { HttpMethod } from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatWebhooks } from '../common/webhooks';
import { heartbeatOutputSchemas } from '../common/output-schemas';
import { heartbeatSamples } from '../common/samples';

export const newMentionTrigger = createTrigger({
  auth: heartbeatAuth,
  name: 'heartbeat_new_mention',
  displayName: 'New Mention in Thread or Comment',
  description: 'Fires when chosen members or groups are @mentioned in a thread or comment.',
  classification: 'READ',
  aiMetadata: {
    description: 'Fires once when one of the chosen members or groups is @mentioned in a new thread or comment (optionally only in some channels). Returns who was mentioned, the author ID, and the thread and comment, re-read from Heartbeat.',
  },
  props: {
    userIds: heartbeatProps.ids({ displayName: 'Mentioned User IDs', description: 'Fire when any of these members is mentioned. Use List Members to find IDs.', required: false }),
    groupIds: heartbeatProps.ids({ displayName: 'Mentioned Group IDs', description: 'Fire when any of these groups is mentioned. Use List Groups to find IDs.', required: false }),
    channelIds: heartbeatProps.ids({ displayName: 'Channel IDs', description: 'Only mentions in these channels. Leave empty for all channels.', required: false }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: heartbeatSamples.mention,
  outputSchema: heartbeatOutputSchemas.mention,
  async onEnable(context) {
    const userIds = heartbeatApi.uuidList({ value: context.propsValue.userIds, label: 'Mentioned User IDs' });
    const groupIds = heartbeatApi.uuidList({ value: context.propsValue.groupIds, label: 'Mentioned Group IDs' });
    if (userIds.length === 0 && groupIds.length === 0) {
      throw new Error('Add at least one Mentioned User ID or Mentioned Group ID.');
    }
    const channelIds = heartbeatApi.uuidList({ value: context.propsValue.channelIds, label: 'Channel IDs' });
    await heartbeatWebhooks.enable({
      token: context.auth.secret_text,
      store: context.store,
      webhookUrl: context.webhookUrl,
      action: {
        name: 'MENTION',
        filter: {
          userSelection: [
            ...userIds.map((id) => ({ id, type: 'USER' })),
            ...groupIds.map((id) => ({ id, type: 'GROUP' })),
          ],
          ...(channelIds.length > 0 ? { channelIDs: channelIds } : {}),
        },
      },
    });
  },
  async onDisable(context) {
    await heartbeatWebhooks.disable({ token: context.auth.secret_text, store: context.store });
  },
  async run(context) {
    const payload = heartbeatWebhooks.payloadOf(context.payload.body);
    const source = heartbeatApi.isRecord(payload['source']) ? payload['source'] : {};
    const threadId = heartbeatWebhooks.uuidOrNull(source['threadID']);
    if (threadId === null) {
      return [];
    }
    const commentId = source['commentID'] === undefined || source['commentID'] === null ? null : heartbeatWebhooks.uuidOrNull(source['commentID']);
    if (commentId === null && source['commentID'] !== undefined && source['commentID'] !== null) {
      return [];
    }
    const thread = await heartbeatWebhooks.fetchOrNull(() =>
      heartbeatApi.request<Record<string, unknown>>({ token: context.auth.secret_text, method: HttpMethod.GET, path: `/threads/${threadId}`, operation: 'get thread' }),
    );
    if (thread === null) {
      return [];
    }
    const comment = commentId === null ? null : findComment({ thread, commentId });
    if (commentId !== null && comment === null) {
      return [];
    }
    if (!(await heartbeatWebhooks.isFirstDelivery({ store: context.store, key: `MENTION:${commentId ?? threadId}` }))) {
      return [];
    }
    return [
      {
        sourceType: commentId === null ? 'THREAD' : 'COMMENT',
        mentionedUsers: payload['mentionedUsers'] ?? null,
        authorUserId: comment?.['userID'] ?? thread['userID'] ?? null,
        channelId: thread['channelID'] ?? null,
        threadId,
        commentId,
        content: comment?.['content'] ?? thread['content'] ?? null,
        threadUrl: thread['url'] ?? null,
        thread: Object.fromEntries(Object.entries(thread).filter(([key]) => key !== 'comments')),
        comment,
      },
    ];
  },
});

function findComment({ thread, commentId }: { thread: Record<string, unknown>; commentId: string }): Record<string, unknown> | null {
  const comments = heartbeatApi.recordList(thread['comments']);
  const all = comments.flatMap((comment) => [comment, ...heartbeatApi.recordList(comment['children'])]);
  return all.find((comment) => comment['id'] === commentId) ?? null;
}
