import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vapiAuth } from '../auth';
import { vapiApi, vapiUtils } from '../common/vapi-api';
import { vapiProps } from '../common/props';
import { vapiOutputSchemas } from '../common/output-schemas';

export const deleteTool = createAction({
  auth: vapiAuth,
  name: 'delete_tool',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Tool',
  description: 'Permanently delete a tool.',
  audience: 'human',
  outputSchema: vapiOutputSchemas.tool,
  props: {
    toolId: vapiProps.toolDropdown({ required: true, description: 'The tool to delete.' }),
  },
  async run(context) {
    const id = vapiUtils.requireId({ value: context.propsValue.toolId, fieldName: 'Tool' });
    const item = await vapiApi.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/tool/${id}`,
      operation: 'delete tool',
    });
    return vapiUtils.stripSecrets(item);
  },
});
