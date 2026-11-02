import { createAction, Property } from '@activepieces/pieces-framework';
import { rabbitmqAuth } from '../auth';
import { publishOutputSchema, rabbitmqCommon } from '../common';

export const sendMessageToQueue = createAction({
  auth: rabbitmqAuth,
  name: 'sendMessageToQueue',
  classification: 'WRITE',
  displayName: 'Send Message to Queue',
  description: 'Send a message on a RabbitMQ queue',
  audience: 'human',
  outputSchema: publishOutputSchema,
  props: {
    queue: Property.ShortText({
      displayName: 'Queue',
      description: 'The name of the queue to send the message to. It must already exist.',
      required: true,
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
    const { queue, data, persistent, contentType, headers } = context.propsValue;
    return rabbitmqCommon.publish({
      auth: context.auth.props,
      target: { type: 'queue', queue },
      data,
      options: { persistent, contentType, headers },
    });
  },
});
