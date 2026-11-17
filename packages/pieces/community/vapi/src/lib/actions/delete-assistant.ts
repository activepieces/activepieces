import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vapiAuth } from '../auth';
import { vapiApi, vapiUtils } from '../common/vapi-api';
import { vapiProps } from '../common/props';
import { vapiOutputSchemas } from '../common/output-schemas';

export const deleteAssistant = createAction({
  auth: vapiAuth,
  name: 'delete_assistant',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Assistant',
  description: 'Permanently delete a assistant.',
  audience: 'human',
  outputSchema: vapiOutputSchemas.assistant,
  props: {
    assistantId: vapiProps.assistantDropdown({ required: true, description: 'The assistant to delete.' }),
  },
  async run(context) {
    const id = vapiUtils.requireId({ value: context.propsValue.assistantId, fieldName: 'Assistant' });
    const item = await vapiApi.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/assistant/${id}`,
      operation: 'delete assistant',
    });
    return vapiUtils.stripSecrets(item);
  },
});
