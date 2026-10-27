import { createAction } from '@activepieces/pieces-framework';
import { rabbitmqAuth } from '../../auth';
import { rabbitmqCommon } from '../../common';

export const listQueues = createAction({
  auth: rabbitmqAuth,
  name: 'rabbitmq_list_queues',
  displayName: 'List Queues',
  description: 'Lists the queues in the connected virtual host.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: {
    fields: [
      {
        key: 'queues',
        label: 'Queues',
        labelKey: 'name',
        listItems: [
          { key: 'name', label: 'Name' },
          { key: 'vhost', label: 'Virtual Host' },
          { key: 'type', label: 'Type' },
          { key: 'durable', label: 'Durable', format: 'boolean' },
          { key: 'messages', label: 'Messages', format: 'number' },
          { key: 'consumers', label: 'Consumers', format: 'number' },
          { key: 'state', label: 'State' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  aiMetadata: {
    description:
      'Lists every queue in the connection\'s virtual host with its message and consumer counts. Use it to find the exact queue name before publishing or reading. Requires the Management API URL in the connection; without it the call fails with a message saying so.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const auth = context.auth.props;
    const queues = await rabbitmqCommon.managementRequest<ManagementQueue[]>({
      auth,
      path: `/queues/${rabbitmqCommon.encodedVhost(auth)}?columns=name,vhost,type,durable,messages,consumers,state`,
    });
    const mapped = queues.map((q) => ({
      name: q.name,
      vhost: q.vhost,
      type: q.type ?? null,
      durable: q.durable,
      messages: q.messages ?? 0,
      consumers: q.consumers ?? 0,
      state: q.state ?? null,
    }));
    return { queues: mapped, count: mapped.length };
  },
});

type ManagementQueue = {
  name: string;
  vhost: string;
  type?: string;
  durable: boolean;
  messages?: number;
  consumers?: number;
  state?: string;
};
