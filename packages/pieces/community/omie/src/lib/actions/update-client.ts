import { createAction, Property } from '@activepieces/pieces-framework';
import { omieAuth } from '../auth';
import { omieClient } from '../common/client';
import { clientFieldProps } from '../common/client-props';
import { omieDropdowns } from '../common/dropdowns';

export const updateClient = createAction({
  auth: omieAuth,
  name: 'update_client',
  classification: 'WRITE',
  displayName: 'Update Client',
  description: 'Updates an existing client or supplier in Omie (Alterar Cliente).',
  audience: 'both',
  aiMetadata: {
    description:
      'Update an existing Omie client or supplier (AlterarCliente), identified by its Omie code or your own integration code. Use Create Client for new records. Setting the same values again is safe to retry.',
    idempotent: true,
  },
  props: {
    codigo_cliente_omie: omieDropdowns.clientDropdown({
      displayName: 'Client',
      description:
        'The client to update. Only the first 500 clients are listed; for larger accounts leave this empty and use the integration code below.',
      required: false,
    }),
    codigo_cliente_integracao: Property.ShortText({
      displayName: 'Integration Code',
      description:
        'Your own code for the client (codigo_cliente_integracao). Used when no client is selected above.',
      required: false,
    }),
    ...clientFieldProps,
  },
  async run({ auth, propsValue }) {
    const { additional_fields, codigo_cliente_omie, codigo_cliente_integracao, ...fields } =
      propsValue;
    if (codigo_cliente_omie === undefined && !codigo_cliente_integracao) {
      throw new Error('Select a client or provide its integration code.');
    }
    return omieClient.call({
      auth,
      module: 'geral/clientes',
      method: 'AlterarCliente',
      param: omieClient.compact({
        value: {
          codigo_cliente_omie,
          codigo_cliente_integracao,
          ...fields,
          ...omieClient.parseJsonObject({ value: additional_fields }),
        },
      }),
    });
  },
});
