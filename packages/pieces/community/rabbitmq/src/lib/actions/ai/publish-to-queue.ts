import { createAction, Property } from '@activepieces/pieces-framework';
import { rabbitmqAuth } from '../../auth';
import { publishOutputSchema, rabbitmqCommon } from '../../common';

export const publishToQueue = createAction({
  auth: rabbitmqAuth,
  name: 'rabbitmq_publish_to_queue',
  displayName: 'Publish to Queue',
  description: 'Publishes a message directly to a queue.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: publishOutputSchema,
  aiMetadata: {
    description:
      'Publishes one message straight onto an existing RabbitMQ queue through the default exchange, and waits for the broker to confirm it. Use Publish to Exchange instead when the message should be routed by an exchange and routing key. Use Get Queue Info or List Queues first if the queue name is unknown; the call fails if the queue does not exist. Not idempotent: every call adds a new message.',
    idempotent: false,
  },
  props: {
    queue: Property.ShortText({
      displayName: 'Queue',
      description: 'Exact name of an existing queue.',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Message body. A valid JSON string is sent as application/json, anything else as text/plain.',
      required: true,
    }),
    ...rabbitmqCommon.publishOptionProps,
  },
  async run(context) {
    const { queue, message, persistent, contentType, headers } = context.propsValue;
    return rabbitmqCommon.publish({
      auth: context.auth.props,
      target: { type: 'queue', queue },
      data: message,
      options: { persistent, contentType: contentType || rabbitmqCommon.detectContentType(message), headers },
    });
  },
});
