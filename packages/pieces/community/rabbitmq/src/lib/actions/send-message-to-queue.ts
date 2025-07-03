import { createAction, Property } from '@activepieces/pieces-framework';
import { rabbitmqAuth } from '../..';
import { rabbitmqConnect } from '../common';

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
        "nested": { "key": "value" },
        "array": ["value1", "value2"]
      },
    }),
  },
  async run(context) {
    const queue = context.propsValue.queue;
    let connection;
    let channel;
    try {
      connection = await rabbitmqConnect(context.auth);
      channel = await connection.createChannel();

      await channel.checkQueue(queue);

      const result = channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(context.propsValue.data))
      );

      if (!result) {
        throw new Error('Failed to send message to exchange');
      }
      return result;
    } finally {
      if (channel) {
        await channel.close();
      }
      if (connection) {
        await connection.close();
      }
    }
  }
});
