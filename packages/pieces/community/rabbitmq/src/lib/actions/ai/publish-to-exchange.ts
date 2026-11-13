import { createAction, Property } from '@activepieces/pieces-framework';
import { rabbitmqAuth } from '../../auth';
import { publishOutputSchema, rabbitmqCommon } from '../../common';

export const publishToExchange = createAction({
  auth: rabbitmqAuth,
  name: 'rabbitmq_publish_to_exchange',
  displayName: 'Publish to Exchange',
  description: 'Publishes a message to an exchange with a routing key.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: publishOutputSchema,
  aiMetadata: {
    description:
      'Publishes one message to an existing RabbitMQ exchange with a routing key, and waits for the broker to confirm it. The exchange routes it to every bound queue whose binding matches; a message that matches no binding is dropped silently. Use List Exchanges and List Bindings to find the exchange and a matching routing key. Use Publish to Queue to target one queue directly. Not idempotent: every call publishes a new message.',
    idempotent: false,
  },
  props: {
    exchange: Property.ShortText({
      displayName: 'Exchange',
      description: 'Exact name of an existing exchange.',
      required: true,
    }),
    routingKey: Property.ShortText({
      displayName: 'Routing Key',
      description: 'Routing key, for example orders.created. Leave empty for fanout exchanges.',
      required: false,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Message body. A valid JSON string is sent as application/json, anything else as text/plain.',
      required: true,
    }),
    ...rabbitmqCommon.publishOptionProps,
  },
  async run(context) {
    const { exchange, routingKey, message, persistent, contentType, headers } = context.propsValue;
    return rabbitmqCommon.publish({
      auth: context.auth.props,
      target: { type: 'exchange', exchange, routingKey: routingKey ?? '' },
      data: message,
      options: { persistent, contentType: contentType || rabbitmqCommon.detectContentType(message), headers },
    });
  },
});
