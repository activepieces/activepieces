import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  Property, CustomAuthProperty, CustomAuthProps, StaticPropsValue

} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { rabbitmqAuth } from '../../index';
import { rabbitmqConnect } from '../common';
import dayjs from 'dayjs';
import { Connection, Channel } from 'amqplib';

const polling: Polling<PiecePropValueSchema<typeof rabbitmqAuth>, {
  queue: string
}> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    let connection: Connection|null = null;
    let channel: Channel|null = null;
    let message = null;

    try {
      connection = await rabbitmqConnect(auth);
      channel = await connection.createChannel();

      await channel.checkQueue(propsValue.queue);

      message = await new Promise((resolve, reject) => {
        channel?.consume(propsValue.queue, (msg) => {
          if (msg) {
            channel?.ack(msg);
            resolve(JSON.parse(msg.content.toString()));
          } else {
            reject('No message.');
          }
        }, { noAck: false });
      });

    } catch (err) {
      console.error(err);
    } finally {
      if (channel) await channel.close();
      if (connection) await connection.close();
    }

    return [{ id: dayjs().toISOString(), data: message }];
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
