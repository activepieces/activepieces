import { createAction, Property } from '@activepieces/pieces-framework';
import { ntfyAuth } from '../auth';
import { ntfyClient } from '../common/client';
import { ntfyProps, PRIORITY_OPTIONS } from '../common/props';
import { fetchMessagesOutputSchema } from '../output-schemas';

export const fetchMessages = createAction({
  auth: ntfyAuth,
  name: 'fetch_messages',
  classification: 'SEARCH',
  displayName: 'Fetch Messages',
  description: 'Read messages that the ntfy server has cached for one or more topics.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads cached messages from one or more ntfy topics, newest first, optionally only since a duration, Unix timestamp or message ID, and filtered by priority, tags, exact title or exact message. Use to look back at what was sent; use List Scheduled Messages for pending ones. Only works while the server caches messages (12 hours on ntfy.sh). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    topics: ntfyProps.topics(),
    since: Property.ShortText({
      displayName: 'Since',
      description:
        'How far back to read: a duration (10m, 2h, 12h), a Unix timestamp (1790662726), a message ID (only messages after it), "latest" (only the newest entry, which returns nothing when that entry is a clear/delete event unless those are included) or "all". Defaults to 12h.',
      required: false,
      defaultValue: '12h',
    }),
    priority: Property.StaticMultiSelectDropdown({
      displayName: 'Priority Filter',
      description: 'Only return messages with any of these priorities. Leave empty for all.',
      required: false,
      options: { options: PRIORITY_OPTIONS },
    }),
    tags: Property.Array({
      displayName: 'Tags Filter',
      description: 'Only return messages that have all of these tags, e.g. backup.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title Filter',
      description: 'Only return messages whose title is exactly this text.',
      required: false,
    }),
    message: Property.ShortText({
      displayName: 'Message Filter',
      description: 'Only return messages whose body is exactly this text.',
      required: false,
    }),
    include_events: Property.Checkbox({
      displayName: 'Include Clear/Delete Events',
      description: 'Also return the message_clear and message_delete events created by Clear/Delete Notification.',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of messages to return (newest first), 1-1000. Defaults to 100.',
      required: false,
      defaultValue: 100,
    }),
  },
  outputSchema: fetchMessagesOutputSchema,
  async run({ auth, propsValue }) {
    const topics = ntfyClient.validateTopicList(propsValue.topics);
    const since = propsValue.since?.trim() || '12h';
    const limit = propsValue.limit ?? 100;
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
      throw new Error('Limit must be a whole number from 1 to 1000.');
    }
    const result = await ntfyClient.pollMessages({
      auth,
      topics,
      since,
      filters: {
        priority: ntfyClient.normalizePriorityFilter(propsValue.priority),
        tags: ntfyClient.normalizeTags(propsValue.tags),
        title: propsValue.title?.trim() || undefined,
        message: propsValue.message?.trim() || undefined,
      },
    });
    const allowedEvents = propsValue.include_events
      ? ['message', 'message_clear', 'message_delete']
      : ['message'];
    const matched = result.messages
      .filter((m) => allowedEvents.includes(m.event))
      .sort((a, b) => b.time - a.time);
    const messages = matched.slice(0, limit);
    return {
      messages,
      count: messages.length,
      total_matched: matched.length,
      has_more: matched.length > messages.length,
      server_truncated: result.truncated,
    };
  },
});
