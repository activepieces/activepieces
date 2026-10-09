import {
  createTrigger,
  Property,
  TriggerStrategy,
  tryCatch,
} from '@activepieces/pieces-framework';
import { IPublishPacket } from 'mqtt';
import { mqttAuth, MqttAuthProps } from '../auth';
import { mqttClient, ReceivedMessage, Subscription } from '../common/client';
import { mqttPayload } from '../common/payload';
import { newMessageOutputSchema } from '../output-schemas';

export const newMessage = createTrigger({
  auth: mqttAuth,
  name: 'new_message',
  displayName: 'New Message',
  description: 'Triggers when a message is published on a topic.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once for every message published on the subscribed MQTT topic filter (wildcards + and # allowed). Uses a persistent broker session, so messages published with QoS 1 or 2 between checks are queued by the broker and delivered at the next check; QoS 0 messages published between checks are not kept. Each run receives one message with its topic, decoded payload, QoS and MQTT 5 properties.',
  },
  props: {
    instructions: Property.MarkDown({
      value: `Activepieces checks the broker on a schedule (every minute by default). Between checks, the broker keeps the messages for this flow in a persistent session.

- Publishers should use **QoS 1 or 2**: QoS 0 messages sent between checks are not kept by the broker.
- The broker limits how many messages it keeps per session (e.g. \`max_queued_messages\` on Mosquitto, 1000 by default).
- When testing, publish a message on the topic (or have a retained one) while the test is running.`,
    }),
    topic: Property.ShortText({
      displayName: 'Topic Filter',
      description:
        'The topic to listen to. Use + for one level and # for all remaining levels, e.g. factory/+/temperature or factory/#',
      required: true,
    }),
    qos: Property.StaticDropdown({
      displayName: 'QoS',
      description: 'QoS 1 or 2 is required for the broker to keep messages between checks.',
      required: true,
      defaultValue: '1',
      options: {
        disabled: false,
        options: [
          { label: '1 - At least once', value: '1' },
          { label: '2 - Exactly once', value: '2' },
        ],
      },
    }),
    payloadDecoding: Property.StaticDropdown({
      displayName: 'Payload Format',
      description: 'Auto detects JSON and text, and falls back to Base64 for binary payloads.',
      required: true,
      defaultValue: 'auto',
      options: {
        disabled: false,
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'JSON', value: 'json' },
          { label: 'Plain Text', value: 'text' },
          { label: 'Base64', value: 'base64' },
          { label: 'Hex', value: 'hex' },
        ],
      },
    }),
    ignoreRetained: Property.Checkbox({
      displayName: 'Ignore Retained Messages',
      description:
        'Skip the retained message the broker sends when the subscription starts. Turn off to also receive it.',
      required: false,
      defaultValue: true,
    }),
    checkIntervalMinutes: Property.Number({
      displayName: 'Check Every (minutes)',
      description: 'How often Activepieces collects new messages. Minimum 1.',
      required: false,
      defaultValue: 1,
    }),
    maxMessagesPerCheck: Property.Number({
      displayName: 'Max Messages Per Check',
      description:
        'With MQTT 5, extra messages stay on the broker for the next check. With MQTT 3.1.1, messages already delivered are always kept.',
      required: false,
      defaultValue: 100,
      advanced: true,
    }),
    listenSeconds: Property.Number({
      displayName: 'Listen Duration (seconds)',
      description: 'How long each check stays connected to collect queued messages.',
      required: false,
      defaultValue: 5,
      advanced: true,
    }),
    noLocal: Property.Checkbox({
      displayName: 'No Local (MQTT 5)',
      description: 'Do not receive messages published by this same connection.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
    retainAsPublished: Property.Checkbox({
      displayName: 'Retain As Published (MQTT 5)',
      description: 'Keep the retain flag set by the publisher on forwarded messages.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
  },
  sampleData: {
    topic: 'factory/line1/temperature',
    payload: { temperature: 21.5, unit: 'C' },
    payload_format: 'json',
    payload_size_bytes: 33,
    qos: 1,
    retain: false,
    duplicate: false,
    received_at: '2026-10-09T08:30:00.000Z',
    content_type: 'application/json',
    response_topic: null,
    correlation_data: null,
    message_expiry_interval: null,
    user_properties: {},
  },
  outputSchema: newMessageOutputSchema,
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const auth = context.auth.props;
    const subscription = buildSubscription({ propsValue: context.propsValue });
    const existing = await context.store.get<StoredSession>(SESSION_STORE_KEY);

    context.setSchedule({
      intervalMs: Math.max(1, Math.round(context.propsValue.checkIntervalMinutes ?? 1)) * 60_000,
    });

    if (context.isRepublish && existing && existing.topic === subscription.topic) {
      await mqttClient.createPersistentSession({ auth, clientId: existing.clientId, subscription });
      return;
    }
    if (existing) {
      await removeSession({ auth, session: existing });
    }

    const session: StoredSession = {
      clientId: mqttClient.generateClientId({ auth }),
      topic: subscription.topic,
    };
    const { error } = await tryCatch(() =>
      mqttClient.createPersistentSession({ auth, clientId: session.clientId, subscription }),
    );
    if (error) {
      throw new Error(mqttClient.describeError({ error }));
    }
    await context.store.put<StoredSession>(SESSION_STORE_KEY, session);
  },
  async onDisable(context) {
    const session = await context.store.get<StoredSession>(SESSION_STORE_KEY);
    if (session) {
      await removeSession({ auth: context.auth.props, session });
      await context.store.delete(SESSION_STORE_KEY);
    }
  },
  async run(context) {
    const session = await context.store.get<StoredSession>(SESSION_STORE_KEY);
    if (!session) {
      throw new Error('The MQTT session is missing. Turn the flow off and on again.');
    }
    const { propsValue } = context;
    const { data, error } = await tryCatch(() =>
      mqttClient.receiveMessages({
        auth: context.auth.props,
        clientId: session.clientId,
        clean: false,
        subscription: buildSubscription({ propsValue }),
        subscribe: 'when_session_missing',
        maxMessages: Math.max(1, propsValue.maxMessagesPerCheck ?? 100),
        listenMs: Math.max(1, propsValue.listenSeconds ?? 5) * 1000,
        accept: (packet) => shouldAccept({ packet, propsValue }),
      }),
    );
    if (error) {
      throw new Error(mqttClient.describeError({ error }));
    }
    return data.map((message) => toOutput({ message, decoding: propsValue.payloadDecoding }));
  },
  async test(context) {
    const { propsValue } = context;
    const auth = context.auth.props;
    const { data, error } = await tryCatch(() =>
      mqttClient.receiveMessages({
        auth,
        clientId: mqttClient.generateClientId({ auth }),
        clean: true,
        subscription: withRetainedMessages({ subscription: buildSubscription({ propsValue }) }),
        subscribe: 'always',
        maxMessages: TEST_MAX_MESSAGES,
        listenMs: TEST_LISTEN_MS,
        accept: () => true,
      }),
    );
    if (error) {
      throw new Error(mqttClient.describeError({ error }));
    }
    return data.map((message) => toOutput({ message, decoding: propsValue.payloadDecoding }));
  },
});

async function removeSession({
  auth,
  session,
}: {
  auth: MqttAuthProps;
  session: StoredSession;
}): Promise<void> {
  await tryCatch(() =>
    mqttClient.deletePersistentSession({ auth, clientId: session.clientId, topic: session.topic }),
  );
}

function buildSubscription({ propsValue }: { propsValue: SubscriptionProps }): Subscription {
  const topic = propsValue.topic.trim();
  if (!topic) {
    throw new Error('Topic Filter is required.');
  }
  return {
    topic,
    options: {
      qos: mqttClient.toQos({ value: propsValue.qos }),
      nl: propsValue.noLocal ?? false,
      rap: propsValue.retainAsPublished ?? false,
      rh: propsValue.ignoreRetained === false ? RETAIN_HANDLING_SEND_IF_NEW : RETAIN_HANDLING_NEVER,
    },
  };
}

function withRetainedMessages({ subscription }: { subscription: Subscription }): Subscription {
  return {
    ...subscription,
    options: { ...subscription.options, rh: RETAIN_HANDLING_SEND },
  };
}

function shouldAccept({
  packet,
  propsValue,
}: {
  packet: IPublishPacket;
  propsValue: SubscriptionProps;
}): boolean {
  if (propsValue.ignoreRetained === false) {
    return true;
  }
  return !packet.retain || propsValue.retainAsPublished === true;
}

function toOutput({ message, decoding }: { message: ReceivedMessage; decoding: string }) {
  const { packet } = message;
  const properties = packet.properties;
  const decoded = mqttPayload.decode({ buffer: toBuffer({ payload: packet.payload }), format: decoding });
  return {
    topic: message.topic,
    payload: decoded.payload,
    payload_format: decoded.payload_format,
    payload_size_bytes: toBuffer({ payload: packet.payload }).length,
    qos: packet.qos,
    retain: packet.retain,
    duplicate: packet.dup,
    received_at: message.receivedAt,
    content_type: properties?.contentType ?? null,
    response_topic: properties?.responseTopic ?? null,
    correlation_data: mqttPayload.decodeToText({ buffer: properties?.correlationData }) ?? null,
    message_expiry_interval: properties?.messageExpiryInterval ?? null,
    user_properties: { ...properties?.userProperties },
  };
}

function toBuffer({ payload }: { payload: string | Buffer }): Buffer {
  return typeof payload === 'string' ? Buffer.from(payload, 'utf8') : payload;
}

const SESSION_STORE_KEY = 'mqtt_session';
const TEST_LISTEN_MS = 10_000;
const TEST_MAX_MESSAGES = 5;
const RETAIN_HANDLING_SEND = 0;
const RETAIN_HANDLING_SEND_IF_NEW = 1;
const RETAIN_HANDLING_NEVER = 2;

type StoredSession = {
  clientId: string;
  topic: string;
};

type SubscriptionProps = {
  topic: string;
  qos: string;
  ignoreRetained?: boolean;
  noLocal?: boolean;
  retainAsPublished?: boolean;
};
