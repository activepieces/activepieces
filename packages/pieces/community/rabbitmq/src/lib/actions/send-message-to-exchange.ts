import { createAction, Property } from '@activepieces/pieces-framework';
import { rabbitmqAuth } from '../auth';
import { publishOutputSchema, rabbitmqCommon } from '../common';

export const sendMessageToExchange = createAction({
  auth: rabbitmqAuth,
  name: 'sendMessageToExchange',
  classification: 'WRITE',
  displayName: 'Send Message to Exchange',
  description: 'Send a message on a RabbitMQ exchange',
  audience: 'human',
  outputSchema: publishOutputSchema,
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
        key: 'value',
        nested: { key: 'value' },
        array: ['value1', 'value2'],
      },
    }),
    ...rabbitmqCommon.publishOptionProps,
  },
  async run(context) {
    const { exchange, routingKey, data, persistent, contentType, headers } = context.propsValue;
    return rabbitmqCommon.publish({
      auth: context.auth.props,
      target: { type: 'exchange', exchange, routingKey: routingKey || '' },
      data,
      options: { persistent, contentType, headers },
    });
  },
});
