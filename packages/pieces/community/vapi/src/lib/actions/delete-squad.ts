import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vapiAuth } from '../auth';
import { vapiApi, vapiUtils } from '../common/vapi-api';
import { vapiProps } from '../common/props';
import { vapiOutputSchemas } from '../common/output-schemas';

export const deleteSquad = createAction({
  auth: vapiAuth,
  name: 'delete_squad',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Squad',
  description: 'Permanently delete a squad.',
  audience: 'human',
  outputSchema: vapiOutputSchemas.squad,
  props: {
    squadId: vapiProps.squadDropdown({ required: true, description: 'The squad to delete.' }),
  },
  async run(context) {
    const id = vapiUtils.requireId({ value: context.propsValue.squadId, fieldName: 'Squad' });
    const item = await vapiApi.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/squad/${id}`,
      operation: 'delete squad',
    });
    return vapiUtils.stripSecrets(item);
  },
});
