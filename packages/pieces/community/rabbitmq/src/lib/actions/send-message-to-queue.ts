import { createAction, Property } from '@activepieces/pieces-framework';
import { rabbitmqAuth } from '../..';
import { rabbitmqConnect } from '../common';
import { Connection, Channel } from 'amqplib';

export const sendMessageToQueue = createAction({
  auth: rabbitmqAuth,
  name: 'sendMessageToQueue',
  displayName: 'sendMessageToQueue',
  description: 'Send a message on a RabbitMQ queue',
  props: {
    queue: Property.ShortText({
      displayName: 'Queue',
      description: 'The name of the exchange to send the message to',
      required: true,
    }),
    data: Property.Json({
      displayName: 'Data',
      description: 'The data to send',
      required: true,
      defaultValue: {
        "key": "value",
        "nested": {"key": "value"},
        "array": ["value1", "value2"]
      },
    }),
  },
  async run(context) {
    let connection: Connection|null = null;
    let channel: Channel|null = null;
    let returnState = false;

    try {
      const queue = context.propsValue.queue;

      connection = await rabbitmqConnect(context.auth);
      channel = await connection.createChannel();

      await channel.checkQueue(queue);

      returnState = channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(context.propsValue.data))
      );
    } catch (err) {
      returnState = false;
      console.error(err);
    } finally {
      if (channel) await channel.close();
      if (connection) await connection.close();
    }

    return returnState;
  }
});
