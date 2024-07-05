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
  queue: string
}> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    let connection;
    let channel: any;
    try {
      connection = await rabbitmqConnect(auth);
      channel = await connection.createChannel();

      await channel.checkQueue(propsValue.queue);

      const message = await new Promise((resolve, reject) => {
        channel.consume(propsValue.queue, (msg: any) => {
          if (msg) {
            channel?.ack(msg);
            resolve(JSON.parse(msg.content.toString()));
          } else {
            reject('No message.');
          }
        }, { noAck: false });
      });

      await channel.close();
      await connection.close();

      return [{ id: dayjs().toISOString(), data: message }];
    } finally {
      if (channel) {
        await channel.close();
      }
      if (connection) {
        await connection.close();
      }
    }
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
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    const { store, auth, propsValue } = context;
    return await pollingHelper.test(polling, { store, auth, propsValue });
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
    return await pollingHelper.poll(polling, { store, auth, propsValue });
  },
});
