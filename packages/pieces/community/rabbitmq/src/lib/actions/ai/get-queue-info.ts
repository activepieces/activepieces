import { createAction, Property } from '@activepieces/pieces-framework';
import { rabbitmqAuth } from '../../auth';
import { rabbitmqCommon } from '../../common';

export const getQueueInfo = createAction({
  auth: rabbitmqAuth,
  name: 'rabbitmq_get_queue_info',
  displayName: 'Get Queue Info',
  description: 'Gets the message and consumer count of a queue.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: {
    fields: [
      { key: 'queue', label: 'Queue' },
      { key: 'messageCount', label: 'Ready Messages', format: 'number' },
      { key: 'consumerCount', label: 'Consumers', format: 'number' },
    ],
  },
  aiMetadata: {
    description:
      'Checks that a RabbitMQ queue exists and returns how many messages are ready and how many consumers are attached. Works without the Management API. Fails if the queue does not exist. Does not read or remove messages.',
    idempotent: true,
  },
  props: {
    queue: Property.ShortText({
      displayName: 'Queue',
      description: 'Exact name of the queue.',
      required: true,
    }),
  },
  async run(context) {
    const { queue } = context.propsValue;
    return rabbitmqCommon.withChannel({
      auth: context.auth.props,
      fn: async (channel) => {
        const info = await channel.checkQueue(queue);
        return {
          queue: info.queue,
          messageCount: info.messageCount,
          consumerCount: info.consumerCount,
        };
      },
    });
  },
});
