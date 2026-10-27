import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { rabbitmqAuth } from '../auth';
import { messageFieldsSchema, ParsedMessage, RabbitmqAuthProps, rabbitmqCommon } from '../common';

async function readMessages({
  auth,
  queue,
  max,
  consume,
}: {
  auth: RabbitmqAuthProps;
  queue: string;
  max: number;
  consume: boolean;
}): Promise<ParsedMessage[]> {
  return rabbitmqCommon.withChannel({
    auth,
    fn: async (channel) => {
      const messages: ParsedMessage[] = [];
      const limit = Math.max(1, Math.floor(max));
      for (let i = 0; i < limit; i++) {
        const message = await channel.get(queue, { noAck: false });
        if (!message) {
          break;
        }
        messages.push(rabbitmqCommon.parseContent(message));
        if (consume) {
          channel.ack(message);
        }
      }
      if (!consume) {
        channel.nackAll(true);
      }
      return messages;
    },
  });
}

export const messageReceived = createTrigger({
  auth: rabbitmqAuth,
  name: 'messageReceived',
  classification: 'READ',
  displayName: 'Message Received',
  description: 'Triggers when a message is received on a RabbitMQ queue',
  aiMetadata: {
    description:
      'Fires for each message on a configured RabbitMQ queue. Each poll pulls up to the configured maximum and acknowledges (removes) the messages it emits. JSON bodies are parsed into content; other bodies are passed as text. Testing the trigger only peeks: messages are put back on the queue.',
  },
  props: {
    queue: Property.ShortText({
      displayName: 'Queue',
      description: 'The name of the queue to listen to',
      required: true,
    }),
    maxMessagesPerPoll: Property.Number({
      displayName: 'Max Messages Per Poll',
      description: 'The maximum number of messages to fetch per poll',
      required: true,
      defaultValue: 50,
    }),
  },
  outputSchema: { fields: messageFieldsSchema },
  sampleData: {
    content: { orderId: 'A-1001', status: 'created' },
    rawContent: '{"orderId":"A-1001","status":"created"}',
    properties: {
      contentType: 'application/json',
      contentEncoding: null,
      headers: {},
      deliveryMode: 2,
      priority: null,
      correlationId: null,
      replyTo: null,
      expiration: null,
      messageId: null,
      timestamp: null,
      type: null,
      userId: null,
      appId: null,
    },
    fields: {
      deliveryTag: 1,
      redelivered: false,
      exchange: '',
      routingKey: 'orders',
      messageCount: 0,
    },
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return readMessages({
      auth: context.auth.props,
      queue: context.propsValue.queue,
      max: Math.min(context.propsValue.maxMessagesPerPoll ?? 5, 5),
      consume: false,
    });
  },
  async onEnable() {
    return;
  },
  async onDisable() {
    return;
  },
  async run(context) {
    return readMessages({
      auth: context.auth.props,
      queue: context.propsValue.queue,
      max: context.propsValue.maxMessagesPerPoll ?? 50,
      consume: true,
    });
  },
});
