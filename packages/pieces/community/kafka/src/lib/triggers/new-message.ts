import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { isNil, tryCatch } from '@activepieces/shared';
import { Admin, Consumer, Kafka } from 'kafkajs';
import { kafkaAuth } from '../auth';
import { kafkaCommon, KafkaMessagePayload } from '../common';

export const newMessage = createTrigger({
  auth: kafkaAuth,
  name: 'new_message',
  displayName: 'New Message',
  description: 'Triggers when a new message is published to a Kafka topic.',
  type: TriggerStrategy.POLLING,
  props: {
    topic: Property.Dropdown({
      auth: kafkaAuth,
      displayName: 'Topic',
      description: 'The topic to consume messages from.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (isNil(auth)) {
          return { disabled: true, options: [], placeholder: 'Connect your Kafka cluster first.' };
        }
        const { data, error } = await tryCatch(() => kafkaCommon.listTopics({ props: auth.props }));
        if (error !== null) {
          return {
            disabled: true,
            options: [],
            placeholder: `Could not list topics: ${error instanceof Error ? error.message : 'unknown error'}`,
          };
        }
        return {
          disabled: false,
          options: data.map((topic) => ({ label: topic, value: topic })),
        };
      },
    }),
    groupId: Property.ShortText({
      displayName: 'Consumer Group ID',
      description:
        'Kafka consumer group used to track which messages were already delivered. Leave empty to use activepieces-<flow id>. Flows sharing a group split the messages between them.',
      required: false,
    }),
    offsetReset: Property.StaticDropdown<OffsetReset, true>({
      displayName: 'Offset Reset',
      description: 'Where to start reading when the consumer group has no committed offsets yet.',
      required: true,
      defaultValue: 'latest',
      options: {
        options: [
          { label: 'Latest (only messages published after enabling the flow)', value: 'latest' },
          { label: 'Earliest (all messages retained on the topic)', value: 'earliest' },
        ],
      },
    }),
    maxMessagesPerPoll: Property.Number({
      displayName: 'Max Messages Per Poll',
      description:
        'Maximum number of messages delivered per poll, between 1 and 1000. Remaining messages are picked up on the next poll.',
      required: false,
      defaultValue: 100,
    }),
  },
  sampleData: {
    key: 'order-1042',
    value: {
      orderId: 1042,
      status: 'created',
      total: 99.5,
    },
    headers: {
      'content-type': 'application/json',
    },
    topic: 'orders',
    partition: 0,
    offset: '4205',
    timestamp: '2025-01-15T09:30:00.000Z',
  },
  async onEnable(context) {
    const { topic, offsetReset } = context.propsValue;
    const groupId = resolveGroupId({ groupId: context.propsValue.groupId, flowId: context.flows.current.id });
    const client = kafkaCommon.createClient({ props: context.auth.props });
    const admin = client.admin();
    await admin.connect();
    try {
      const committed = await fetchCommittedOffsets({ admin, groupId, topic });
      const hasCommittedOffsets = Array.from(committed.values()).some((offset) => offset >= 0);
      // Anchor the group to a concrete numeric offset at enable time so the first poll has a stable
      // baseline and messages published between polls are never skipped. resetOffsets() only stores an
      // unresolved sentinel (-1) until a consumer connects, which keeps the admin-side lag check at 0
      // forever — so commit the watermark (high=latest, low=earliest) explicitly instead.
      if (!hasCommittedOffsets) {
        const topicOffsets = await admin.fetchTopicOffsets(topic);
        await admin.setOffsets({
          groupId,
          topic,
          partitions: topicOffsets.map((partition) => ({
            partition: partition.partition,
            offset: offsetReset === 'earliest' ? partition.low : partition.high,
          })),
        });
      }
    }
    finally {
      await admin.disconnect();
    }
  },
  async onDisable() {
    // Committed consumer-group offsets are kept so a re-enabled flow resumes where it left off.
  },
  async run(context) {
    const { topic, offsetReset } = context.propsValue;
    const groupId = resolveGroupId({ groupId: context.propsValue.groupId, flowId: context.flows.current.id });
    const maxMessages = resolveMaxMessages(context.propsValue.maxMessagesPerPoll);
    const client = kafkaCommon.createClient({ props: context.auth.props });
    const lag = await fetchLag({ client, groupId, topic, offsetReset });
    if (lag === 0) {
      return [];
    }
    const messages = await consumeBatch({
      client,
      groupId,
      topic,
      fromBeginning: offsetReset === 'earliest',
      target: Math.min(lag, maxMessages),
    });
    return [...messages].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  },
  async test(context) {
    const { topic } = context.propsValue;
    const client = kafkaCommon.createClient({ props: context.auth.props });
    const ranges = await fetchRecentRanges({ client, topic });
    const expected = ranges.reduce((total, range) => total + range.count, 0);
    if (expected === 0) {
      return [];
    }
    const groupId = `activepieces-test-${context.flows.current.id}`;
    const messages = await readRecentMessages({ client, groupId, topic, ranges, expected });
    return [...messages].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, SAMPLE_MESSAGE_COUNT);
  },
});

const DEFAULT_MAX_MESSAGES_PER_POLL = 100;
const MAX_MESSAGES_PER_POLL_LIMIT = 1000;
const POLL_WINDOW_MS = 12_000;
const TEST_WINDOW_MS = 8_000;
const IDLE_WINDOW_MS = 3_000;
const SAMPLE_MESSAGE_COUNT = 5;

function resolveGroupId({ groupId, flowId }: { groupId: string | undefined; flowId: string }): string {
  const trimmed = groupId?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : `activepieces-${flowId}`;
}

function resolveMaxMessages(maxMessagesPerPoll: number | undefined): number {
  if (isNil(maxMessagesPerPoll) || Number.isNaN(maxMessagesPerPoll)) {
    return DEFAULT_MAX_MESSAGES_PER_POLL;
  }
  return Math.min(Math.max(Math.trunc(maxMessagesPerPoll), 1), MAX_MESSAGES_PER_POLL_LIMIT);
}

async function fetchCommittedOffsets({
  admin,
  groupId,
  topic,
}: {
  admin: Admin;
  groupId: string;
  topic: string;
}): Promise<Map<number, number>> {
  const groupOffsets = await admin.fetchOffsets({ groupId, topics: [topic] });
  const partitions = groupOffsets.find((entry) => entry.topic === topic)?.partitions ?? [];
  return new Map(partitions.map((partition) => [partition.partition, Number(partition.offset)]));
}

async function fetchLag({
  client,
  groupId,
  topic,
  offsetReset,
}: {
  client: Kafka;
  groupId: string;
  topic: string;
  offsetReset: OffsetReset;
}): Promise<number> {
  const admin = client.admin();
  await admin.connect();
  try {
    const topicOffsets = await admin.fetchTopicOffsets(topic);
    const committed = await fetchCommittedOffsets({ admin, groupId, topic });
    return topicOffsets.reduce((lag, partition) => {
      const high = Number(partition.high);
      const low = Number(partition.low);
      const committedOffset = committed.get(partition.partition) ?? -1;
      const start =
        committedOffset >= 0
          ? Math.min(Math.max(committedOffset, low), high)
          : offsetReset === 'earliest'
            ? low
            : high;
      return lag + (high - start);
    }, 0);
  }
  finally {
    await admin.disconnect();
  }
}

async function consumeBatch({
  client,
  groupId,
  topic,
  fromBeginning,
  target,
}: {
  client: Kafka;
  groupId: string;
  topic: string;
  fromBeginning: boolean;
  target: number;
}): Promise<KafkaMessagePayload[]> {
  const consumer = client.consumer({ groupId, allowAutoTopicCreation: false });
  await consumer.connect();
  try {
    await consumer.subscribe({ topics: [topic], fromBeginning });
    const messages = await collectMessages({ consumer, target, windowMs: POLL_WINDOW_MS });
    // Offsets are committed only after the messages are in hand, so a failure anywhere
    // before this point redelivers them on the next poll (at-least-once).
    if (messages.length > 0) {
      await consumer.commitOffsets(buildCommitEntries({ messages }));
    }
    return messages;
  }
  finally {
    await consumer.disconnect();
  }
}

async function fetchRecentRanges({ client, topic }: { client: Kafka; topic: string }): Promise<PartitionRange[]> {
  const admin = client.admin();
  await admin.connect();
  try {
    const topicOffsets = await admin.fetchTopicOffsets(topic);
    return topicOffsets
      .map((partition) => {
        const high = Number(partition.high);
        const low = Number(partition.low);
        const start = Math.max(low, high - SAMPLE_MESSAGE_COUNT);
        return { partition: partition.partition, start, count: high - start };
      })
      .filter((range) => range.count > 0);
  }
  finally {
    await admin.disconnect();
  }
}

async function readRecentMessages({
  client,
  groupId,
  topic,
  ranges,
  expected,
}: {
  client: Kafka;
  groupId: string;
  topic: string;
  ranges: PartitionRange[];
  expected: number;
}): Promise<KafkaMessagePayload[]> {
  // A dedicated per-flow test group that never commits offsets: it neither advances the flow's real
  // consumer group nor spawns a new group per click. A stable name (vs. a timestamped one) keeps test
  // groups bounded to one per flow on managed brokers like Event Hubs that cap consumer-group count.
  const consumer = client.consumer({
    groupId,
    allowAutoTopicCreation: false,
  });
  await consumer.connect();
  try {
    // fromBeginning: false keeps the consumer parked at the high watermark until the seeks below
    // rewind each partition to the last few messages.
    await consumer.subscribe({ topics: [topic], fromBeginning: false });
    return await collectMessages({
      consumer,
      target: expected,
      windowMs: TEST_WINDOW_MS,
      onGroupJoin: () => {
        for (const range of ranges) {
          consumer.seek({ topic, partition: range.partition, offset: String(range.start) });
        }
      },
    });
  }
  finally {
    await consumer.disconnect();
  }
}

async function collectMessages({
  consumer,
  target,
  windowMs,
  onGroupJoin,
}: {
  consumer: Consumer;
  target: number;
  windowMs: number;
  onGroupJoin?: () => void;
}): Promise<KafkaMessagePayload[]> {
  const collected: KafkaMessagePayload[] = [];
  let failure: Error | undefined;
  await new Promise<void>((resolve) => {
    let finished = false;
    let idleTimer: NodeJS.Timeout | undefined;
    const finish = (error?: Error): void => {
      if (finished) {
        return;
      }
      finished = true;
      failure = error;
      clearTimeout(hardTimer);
      if (idleTimer !== undefined) {
        clearTimeout(idleTimer);
      }
      resolve();
    };
    // A fatal consumer crash — topic/group authorization denied, unsupported SASL mechanism —
    // stops the fetch loop in the background WITHOUT rejecting run(), so capture it here and
    // rethrow instead of returning a silent empty batch that hides the failure and stalls the
    // offset. Retriable crashes (restart: true) are left for KafkaJS to recover within the window.
    consumer.on(consumer.events.CRASH, (event) => {
      if (!event.payload.restart) {
        finish(event.payload.error);
      }
    });
    // Seek only once the group has joined and partitions are assigned — the reliable point to
    // reposition, rather than racing the moment run() resolves (which precedes assignment).
    if (onGroupJoin !== undefined) {
      consumer.on(consumer.events.GROUP_JOIN, () => {
        try {
          onGroupJoin();
        }
        catch (error) {
          finish(error instanceof Error ? error : new Error(String(error)));
        }
      });
    }
    // Hard deadline keeps a poll bounded even when compaction or aborted transactions make
    // the expected message count unreachable. finish() only runs once messages arrive via the
    // event loop, by which point hardTimer is assigned.
    const hardTimer = setTimeout(() => finish(), windowMs);
    consumer
      .run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
          if (finished) {
            return;
          }
          collected.push(kafkaCommon.parseMessage({ topic, partition, message }));
          if (collected.length >= target) {
            finish();
            return;
          }
          if (idleTimer !== undefined) {
            clearTimeout(idleTimer);
          }
          idleTimer = setTimeout(() => finish(), IDLE_WINDOW_MS);
        },
      })
      .catch((error) => finish(error instanceof Error ? error : new Error(String(error))));
  });
  if (failure !== undefined) {
    throw failure;
  }
  return collected;
}

function buildCommitEntries({ messages }: { messages: KafkaMessagePayload[] }): CommitEntry[] {
  const nextOffsets = new Map<string, CommitEntry>();
  for (const message of messages) {
    const key = `${message.topic}:${message.partition}`;
    const next = Number(message.offset) + 1;
    const existing = nextOffsets.get(key);
    if (isNil(existing) || next > Number(existing.offset)) {
      nextOffsets.set(key, { topic: message.topic, partition: message.partition, offset: String(next) });
    }
  }
  return Array.from(nextOffsets.values());
}

type OffsetReset = 'earliest' | 'latest';

type PartitionRange = {
  partition: number;
  start: number;
  count: number;
};

type CommitEntry = {
  topic: string;
  partition: number;
  offset: string;
};
