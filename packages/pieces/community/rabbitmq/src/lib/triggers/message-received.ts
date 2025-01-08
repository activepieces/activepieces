import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { rabbitmqAuth } from '../../index';
import { rabbitmqConnect } from '../common';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<typeof rabbitmqAuth>, {
  queue: string,
  maxMessagesPerPoll: number,
}> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const connection = await rabbitmqConnect(auth);
    const channel = await connection.createChannel();
    const messages = [];

    try {
      const queueInfo = await channel.checkQueue(propsValue.queue);

      if (queueInfo.messageCount === 0) {
        return [];
      }

      for (let i = 0; i < propsValue.maxMessagesPerPoll; i++) {
        const message = await channel.get(propsValue.queue);
        if (!message) {
          break;
        }
        messages.push({
          id: dayjs().toISOString(),
          data: JSON.parse(message.content.toString()),
        });
        channel.ack(message);
      }
    } finally {
      await channel.close();
      await connection.close();
    }

    return messages;
  },
};

export const messageReceived = createTrigger({
  auth: rabbitmqAuth,
  name: 'messageReceived',
  displayName: 'Message Received',
  description: 'Triggers when a message is received on a RabbitMQ queue',
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
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    const { store, auth, propsValue } = context;
    return await pollingHelper.test(polling, { store, auth, propsValue, files: context.files });
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },

  async run(context) {
    const { store, auth, propsValue } = context;
    return await pollingHelper.poll(polling, { store, auth, propsValue, files: context.files });
  },
});
