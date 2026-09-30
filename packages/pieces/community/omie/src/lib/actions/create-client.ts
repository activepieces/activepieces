import { createAction } from '@activepieces/pieces-framework';
import { omieAuth } from '../auth';
import { omieClient } from '../common/client';
import { clientFieldProps } from '../common/client-props';

export const createClient = createAction({
  auth: omieAuth,
  name: 'create_client',
  classification: 'WRITE',
  displayName: 'Create Client',
  description: 'Registers a new client or supplier in Omie (Cadastrar Cliente).',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a client or supplier in Omie (IncluirCliente). Use when the person or company does not exist yet; to change an existing one use Update Client. Each call creates a new record, so retries duplicate.',
    idempotent: false,
  },
  props: clientFieldProps,
  async run({ auth, propsValue }) {
    const { additional_fields, ...fields } = propsValue;
    return omieClient.call({
      auth,
      module: 'geral/clientes',
      method: 'IncluirCliente',
      param: omieClient.compact({
        value: {
          codigo_cliente_integracao: omieClient.newIntegrationCode(),
          ...fields,
          ...omieClient.parseJsonObject({ value: additional_fields }),
        },
      }),
    });
  },
});
