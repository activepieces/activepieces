import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vapiAuth } from '../auth';
import { vapiApi, vapiUtils } from '../common/vapi-api';
import { vapiOutputSchemas } from '../common/output-schemas';

export const getSquad = createAction({
  auth: vapiAuth,
  name: 'get_squad',
  classification: 'READ',
  displayName: 'Get Squad',
  description: 'Get the details of a squad by its ID.',
  audience: 'both',
  outputSchema: vapiOutputSchemas.squad,
  aiMetadata: {
    description:
      'Returns one Vapi squad by ID: name and member assistants (each with assistantId). Get the ID from Find Squad. Read-only.',
    idempotent: true,
  },
  props: {
    squadId: Property.ShortText({ displayName: 'Squad ID', description: 'ID of the squad.', required: true }),
  },
  async run(context) {
    const id = vapiUtils.requireId({ value: context.propsValue.squadId, fieldName: 'Squad ID' });
    const item = await vapiApi.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/squad/${id}`,
      operation: 'get squad',
    });
    return vapiUtils.stripSecrets(item);
  },
});
