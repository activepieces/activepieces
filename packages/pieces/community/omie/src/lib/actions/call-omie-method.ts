import { createAction, Property } from '@activepieces/pieces-framework';
import { omieAuth } from '../auth';
import { omieClient } from '../common/client';

export const callOmieMethod = createAction({
  auth: omieAuth,
  name: 'call_omie_method',
  classification: 'WRITE',
  displayName: 'Call Omie Method',
  description: 'Calls any Omie API method by module, method name and JSON parameters.',
  audience: 'both',
  aiMetadata: {
    description:
      'Escape hatch for any Omie API method not covered by another action, e.g. module "geral/produtos", method "ListarProdutos". The effect depends on the method, so retries may duplicate. Omie blocks a method for 30 minutes after 10 bad requests.',
    idempotent: false,
  },
  props: {
    module: Property.ShortText({
      displayName: 'Module',
      description: 'The API module path, e.g. "geral/clientes" or "financas/contapagar".',
      required: true,
    }),
    method: Property.ShortText({
      displayName: 'Method',
      description: 'The method name (call), e.g. "ListarClientes" or "IncluirContaPagar".',
      required: true,
    }),
    param: Property.Json({
      displayName: 'Parameters',
      description:
        'The method parameters as one JSON object, e.g. {"pagina": 1, "registros_por_pagina": 20}. It is sent as the single item of Omie\'s param array.',
      required: false,
      defaultValue: {},
    }),
  },
  async run({ auth, propsValue }) {
    return omieClient.call({
      auth,
      module: propsValue.module.replace(/^\/+|\/+$/g, ''),
      method: propsValue.method,
      param: omieClient.parseJsonObject({ value: propsValue.param }),
    });
  },
});
