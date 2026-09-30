import { createAction } from '@activepieces/pieces-framework';
import { ntfyAuth } from '../auth';
import { ntfyClient } from '../common/client';
import { ntfyProps } from '../common/props';
import { listScheduledMessagesOutputSchema } from '../output-schemas';

export const listScheduledMessages = createAction({
  auth: ntfyAuth,
  name: 'list_scheduled_messages',
  classification: 'SEARCH',
  displayName: 'List Scheduled Messages',
  description: 'List messages that are scheduled for later delivery and have not been delivered yet.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the messages on one or more ntfy topics that were published with a delay and are still waiting to be delivered, soonest first. Use before cancelling one with Delete Notification or replacing it with Update Notification; use Fetch Messages for delivered ones. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    topics: ntfyProps.topics(),
  },
  outputSchema: listScheduledMessagesOutputSchema,
  async run({ auth, propsValue }) {
    const topics = ntfyClient.validateTopicList(propsValue.topics);
    const result = await ntfyClient.pollMessages({ auth, topics, since: 'all', scheduled: true });
    const messages = result.messages
      .filter((m) => m.event === 'message' && m.time > result.serverNow)
      .sort((a, b) => a.time - b.time);
    return { messages, count: messages.length, server_truncated: result.truncated };
  },
});
