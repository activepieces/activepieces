import { createAction, Property } from '@activepieces/pieces-framework';
import { rabbitmqAuth } from '../auth';
import { rabbitmqConnect } from '../common';

export const sendMessageToExchange = createAction({
  auth: rabbitmqAuth,
  name: 'sendMessageToExchange',
  displayName: 'sendMessageToExchange',
  description: 'Send a message on a RabbitMQ exchange',
  audience: 'both',
  aiMetadata: { description: 'Publishes a JSON message to a named RabbitMQ exchange, optionally with a routing key that the exchange uses to route the message to bound queues. Choose this to emit an event into a pub/sub or topic-style topology where one exchange fans out to multiple consumers; use the send-to-queue action instead to push directly onto a specific queue. The target exchange must already exist (the call verifies it first). Not idempotent: each call publishes a new message.', idempotent: false },
  props: {
    exchange: Property.ShortText({
      displayName: 'Exchange',
      description: 'The name of the exchange to send the message to',
      required: true,
    }),
    routingKey: Property.ShortText({
      displayName: 'Routing Key (Optional)',
      description: 'The routing key to use when sending the message',
      required: false,
      defaultValue: '',
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
    let connection;
    let channel;
    try {
      const exchange = context.propsValue.exchange;
      const routingKey = context.propsValue.routingKey || '';

      connection = await rabbitmqConnect(context.auth.props);
      channel = await connection.createChannel();

      await channel.checkExchange(exchange);

      const result = channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(context.propsValue.data))
      );

      if (!result) {
        throw new Error('Failed to send message to exchange');
      }
      return result;
    } finally {
      if (channel)
        await channel.close();
      if (connection)
        await connection.close();
    }
  }
});
