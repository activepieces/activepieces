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
  description: 'Read the messages the server has cached for one or more topics.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads cached messages from one or more ntfy topics, newest first, optionally only since a duration, Unix timestamp or message ID, and filtered by priority, tags, exact title or exact message. "latest" returns only the newest entry, which is dropped when it is a clear/delete event and those are not included. Use to look back at what was sent; use List Scheduled Messages for pending ones. Only works while the server caches messages (12 hours on ntfy.sh); ntfy.sh writes its cache in batches, so a message published 1-3 seconds earlier may not be returned yet. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    topics: ntfyProps.topics(),
    since: Property.ShortText({
      displayName: 'Since',
      description: 'How far back: a duration, Unix timestamp, message ID, latest or all.',
      placeholder: '12h',
      required: false,
      defaultValue: '12h',
    }),
    priority: Property.StaticMultiSelectDropdown({
      displayName: 'Priority Filter',
      description: 'Only messages with any of these priorities. Empty: all.',
      required: false,
      options: { options: PRIORITY_OPTIONS },
    }),
    tags: Property.Array({
      displayName: 'Tags Filter',
      description: 'Only messages that have all of these tags.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title Filter',
      description: 'Exact title to match.',
      placeholder: 'Backup finished',
      required: false,
      width: 'half',
    }),
    message: Property.ShortText({
      displayName: 'Message Filter',
      description: 'Exact body to match.',
      required: false,
      width: 'half',
    }),
    include_events: Property.Checkbox({
      displayName: 'Include Clear/Delete Events',
      description: 'Also return events created by Clear and Delete Notification.',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Most messages to return, newest first, 1 to 1000. Empty: 100.',
      required: false,
      defaultValue: 100,
      min: 1,
      max: 1000,
    }),
  },
  propertyGroups: [
    { key: 'source', display: 'section', label: 'Read from', icon: 'inbox', props: ['topics', 'since'] },
    { key: 'filters', display: 'section', label: 'Filters', icon: 'filter', props: ['priority', 'tags', 'title', 'message'] },
    { key: 'results', display: 'section', label: 'Results', icon: 'sliders', props: ['limit', 'include_events'] },
  ],
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
    const matched = ntfyClient.newestFirst(result.messages.filter((m) => allowedEvents.includes(m.event)));
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
