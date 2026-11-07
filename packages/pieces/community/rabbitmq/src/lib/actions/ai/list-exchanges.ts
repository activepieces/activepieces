import { createAction } from '@activepieces/pieces-framework';
import { rabbitmqAuth } from '../../auth';
import { rabbitmqCommon } from '../../common';

export const listExchanges = createAction({
  auth: rabbitmqAuth,
  name: 'rabbitmq_list_exchanges',
  displayName: 'List Exchanges',
  description: 'Lists the exchanges in the connected virtual host.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: {
    fields: [
      {
        key: 'exchanges',
        label: 'Exchanges',
        labelKey: 'name',
        listItems: [
          { key: 'name', label: 'Name' },
          { key: 'type', label: 'Type' },
          { key: 'durable', label: 'Durable', format: 'boolean' },
          { key: 'autoDelete', label: 'Auto Delete', format: 'boolean' },
          { key: 'internal', label: 'Internal', format: 'boolean' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  aiMetadata: {
    description:
      'Lists the exchanges in the connection\'s virtual host with their type (direct, topic, fanout, headers). The unnamed default exchange is left out. Use it to find an exchange name for Publish to Exchange. Requires the Management API URL in the connection; without it the call fails with a message saying so.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const auth = context.auth.props;
    const exchanges = await rabbitmqCommon.managementRequest<ManagementExchange[]>({
      auth,
      path: `/exchanges/${rabbitmqCommon.encodedVhost(auth)}`,
    });
    const mapped = exchanges
      .filter((e) => e.name !== '')
      .map((e) => ({
        name: e.name,
        type: e.type,
        durable: e.durable,
        autoDelete: e.auto_delete,
        internal: e.internal,
      }));
    return { exchanges: mapped, count: mapped.length };
  },
});

type ManagementExchange = {
  name: string;
  type: string;
  durable: boolean;
  auto_delete: boolean;
  internal: boolean;
};
