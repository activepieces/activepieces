import { createAction, Property } from '@activepieces/pieces-framework';
import { omieAuth } from '../auth';
import { omieClient } from '../common/client';
import { omieEndpoints } from '../common/endpoints';

export const listClients = createAction({
  auth: omieAuth,
  name: 'list_clients',
  classification: 'SEARCH',
  displayName: 'List Clients',
  description: 'Lists clients and suppliers registered in Omie, one page at a time (Listar Clientes).',
  audience: 'both',
  aiMetadata: {
    description:
      'List Omie clients and suppliers page by page (ListarClientes). Returns an empty list when the page has no records. Increase Page to read further; safe to retry.',
    idempotent: true,
  },
  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1.',
      required: false,
      defaultValue: 1,
    }),
    page_size: Property.Number({
      displayName: 'Records per Page',
      description: 'Number of clients per page. Omie allows at most 100.',
      required: false,
      defaultValue: 50,
    }),
  },
  async run({ auth, propsValue }) {
    const { items } = await omieClient.listPage({
      auth,
      endpoint: omieEndpoints.clients,
      page: propsValue.page ?? 1,
      pageSize: Math.min(propsValue.page_size ?? 50, 100),
      filters: { apenas_importado_api: 'N' },
    });
    return items;
  },
});
