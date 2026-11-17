import { createAction, Property } from '@activepieces/pieces-framework';
import { rabbitmqAuth } from '../../auth';
import { rabbitmqCommon } from '../../common';

export const listBindings = createAction({
  auth: rabbitmqAuth,
  name: 'rabbitmq_list_bindings',
  displayName: 'List Bindings',
  description: 'Lists the bindings in the connected virtual host.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: {
    fields: [
      {
        key: 'bindings',
        label: 'Bindings',
        listItems: [
          { key: 'source', label: 'Source Exchange' },
          { key: 'destination', label: 'Destination' },
          { key: 'destinationType', label: 'Destination Type' },
          { key: 'routingKey', label: 'Routing Key' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  aiMetadata: {
    description:
      'Lists the bindings that route messages from exchanges to queues or other exchanges in the connection\'s virtual host. Filter by exchange to see which routing keys reach which queues before calling Publish to Exchange. Default-exchange bindings are left out. Requires the Management API URL in the connection; without it the call fails with a message saying so.',
    idempotent: true,
  },
  props: {
    exchange: Property.ShortText({
      displayName: 'Exchange',
      description: 'Optional. Only return bindings whose source is this exchange.',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth.props;
    const { exchange } = context.propsValue;
    const vhost = rabbitmqCommon.encodedVhost(auth);
    const path = exchange
      ? `/exchanges/${vhost}/${encodeURIComponent(exchange)}/bindings/source`
      : `/bindings/${vhost}`;
    const bindings = await rabbitmqCommon.managementRequest<ManagementBinding[]>({ auth, path });
    const mapped = bindings
      .filter((b) => b.source !== '')
      .map((b) => ({
        source: b.source,
        destination: b.destination,
        destinationType: b.destination_type,
        routingKey: b.routing_key,
      }));
    return { bindings: mapped, count: mapped.length };
  },
});

type ManagementBinding = {
  source: string;
  destination: string;
  destination_type: string;
  routing_key: string;
};
