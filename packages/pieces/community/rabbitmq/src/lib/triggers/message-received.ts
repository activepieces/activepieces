import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { rabbitmqAuth } from '../auth';
import { RabbitmqAuthProps, rabbitmqCommon } from '../common';

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
}): Promise<unknown[]> {
  return rabbitmqCommon.withChannel({
    auth,
    fn: async (channel) => {
      const messages: unknown[] = [];
      const limit = Math.max(1, Math.floor(max));
      for (let i = 0; i < limit; i++) {
        const message = await channel.get(queue, { noAck: false });
        if (!message) {
          break;
        }
        messages.push(rabbitmqCommon.parseContent(message).content);
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
      'Fires for each message on a configured RabbitMQ queue. Each poll pulls up to the configured maximum and acknowledges (removes) the messages it emits. Each output is the message body itself: JSON bodies are emitted as the parsed object, other bodies as a text string. Testing the trigger only peeks: messages are put back on the queue.',
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
  outputSchema: {
    fields: [
      { key: 'orderId', label: 'Order ID', description: 'Example field: the trigger output is the parsed JSON message body, so its keys are the keys of your message' },
      { key: 'status', label: 'Status', description: 'Example field from the parsed JSON message body' },
    ],
  },
  sampleData: { orderId: 'A-1001', status: 'created' },
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
