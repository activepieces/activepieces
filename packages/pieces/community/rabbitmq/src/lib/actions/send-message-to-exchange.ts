import { createAction, Property } from '@activepieces/pieces-framework';
import { rabbitmqAuth } from '../..';
import { rabbitmqConnect } from '../common';
import { Connection, Channel } from 'amqplib';

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

    let connection: Connection|null = null;
    let channel: Channel|null = null;
    let returnState = false;

    try {
      connection = await rabbitmqConnect(context.auth);
      channel = await connection.createChannel();

      await channel.checkExchange(exchange);

      returnState = channel.publish(
        exchange,
        routingKey,
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
