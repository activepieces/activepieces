import { createAction, Property } from '@activepieces/pieces-framework';
import { rabbitmqAuth } from '../..';
import { rabbitmqConnect } from '../common';

export const sendMessageToExchange = createAction({
  auth: rabbitmqAuth,
  name: 'sendMessageToExchange',
  displayName: 'sendMessageToExchange',
  description: 'Send a message on a RabbitMQ exchange',
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
        "nested": {"key": "value"},
        "array": ["value1", "value2"]
      },
    }),
  },
  async run(context) {
    const exchange = context.propsValue.exchange;
    const routingKey = context.propsValue.routingKey || '';

    const connection = await rabbitmqConnect(context.auth);
    const channel = await connection.createChannel();

    await channel.checkExchange(exchange);

    const result = channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(context.propsValue.data))
    );

    await channel.close();
    await connection.close();

    if (!result) {
      throw new Error('Failed to send message to exchange');
    }
  }
});
