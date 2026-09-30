import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { ntfyAuth } from '../auth';
import { ntfyClient, NtfyAuthValue, NtfyCursor, PollFilters } from '../common/client';
import { ntfyProps, PRIORITY_OPTIONS } from '../common/props';
import { newMessageTriggerOutputSchema } from '../output-schemas';

const CURSOR_KEY = 'ntfy_new_message_cursor';

export const newMessage = createTrigger({
  auth: ntfyAuth,
  name: 'new_message',
  classification: 'READ',
  displayName: 'New Message',
  description:
    'Triggers when a message is published to a ntfy topic. Needs the server to cache messages (ntfy.sh keeps them 12 hours); messages sent with "Do not cache" are never seen.',
  aiMetadata: {
    description:
      'Fires once per new message published to the chosen ntfy topic(s), including scheduled messages when they are delivered and updates sent with a sequence ID; optionally only for given priorities or tags. Clear and delete events do not fire it. Polls the server cache, so uncached messages are missed. If more than 10 MB of messages arrive on any of the topics between two polls, the server returns only the newest ones and cannot return the rest; every run from that poll carries replay_truncated: true.',
  },
  props: {
    topics: ntfyProps.topics(),
    priority: Property.StaticMultiSelectDropdown({
      displayName: 'Priority Filter',
      description: 'Only trigger for messages with any of these priorities. Leave empty for all.',
      required: false,
      options: { options: PRIORITY_OPTIONS },
    }),
    tags: Property.Array({
      displayName: 'Tags Filter',
      description: 'Only trigger for messages that have all of these tags, e.g. backup.',
      required: false,
    }),
  },
  outputSchema: newMessageTriggerOutputSchema,
  sampleData: {
    id: 'GjpkhqcNaNyE',
    time: 1790662726,
    expires: 1790705926,
    event: 'message',
    topic: 'backups_home',
    title: 'Backup finished',
    message: 'Nightly backup finished in 4m 12s',
    priority: 4,
    tags: ['white_check_mark', 'backup'],
    click: 'https://example.com/backups/42',
    replay_truncated: false,
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    if (context.isRepublish && (await context.store.get<NtfyCursor>(CURSOR_KEY))) {
      return;
    }
    const cursor = await initialCursor({ auth: context.auth, propsValue: context.propsValue });
    await context.store.put(CURSOR_KEY, cursor);
  },
  async onDisable(context) {
    await context.store.delete(CURSOR_KEY);
  },
  async test(context) {
    const topics = ntfyClient.validateTopicList(context.propsValue.topics);
    const result = await ntfyClient.pollMessages({
      auth: context.auth,
      topics,
      since: '12h',
      filters: filtersFrom(context.propsValue),
    });
    return ntfyClient
      .newestFirst(result.messages.filter((m) => m.event === 'message'))
      .slice(0, 5)
      .map((message) => ({ ...message, replay_truncated: result.truncated }));
  },
  async run(context) {
    const stored = await context.store.get<NtfyCursor>(CURSOR_KEY);
    if (!stored) {
      await context.store.put(
        CURSOR_KEY,
        await initialCursor({ auth: context.auth, propsValue: context.propsValue })
      );
      return [];
    }
    const topics = ntfyClient.validateTopicList(context.propsValue.topics);
    const since = Math.max(0, stored.lastTime - ntfyClient.CURSOR_OVERLAP_SECONDS);
    const result = await ntfyClient.pollMessages({
      auth: context.auth,
      topics,
      since: String(since),
      filters: filtersFrom(context.propsValue),
    });
    const { newItems, cursor } = ntfyClient.advanceCursor({ cursor: stored, fetched: result.messages });
    await context.store.put(CURSOR_KEY, cursor);
    return newItems.map((message) => ({ ...message, replay_truncated: result.truncated }));
  },
});

async function initialCursor({
  auth,
  propsValue,
}: {
  auth: NtfyAuthValue;
  propsValue: TriggerPropsValue;
}): Promise<NtfyCursor> {
  const topics = ntfyClient.validateTopicList(propsValue.topics);
  const result = await ntfyClient.pollMessages({
    auth,
    topics,
    since: `${ntfyClient.CURSOR_OVERLAP_SECONDS}s`,
    filters: filtersFrom(propsValue),
  });
  const seeded = ntfyClient.advanceCursor({
    cursor: { lastTime: result.serverNow, seen: [] },
    fetched: result.messages,
  });
  return seeded.cursor;
}

function filtersFrom(propsValue: TriggerPropsValue): PollFilters {
  return {
    priority: ntfyClient.normalizePriorityFilter(propsValue.priority),
    tags: ntfyClient.normalizeTags(propsValue.tags),
  };
}

type TriggerPropsValue = {
  topics?: string;
  priority?: unknown[];
  tags?: unknown[];
};
