import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vapiAuth } from '../auth';
import { vapiApi, vapiUtils } from '../common/vapi-api';
import { vapiOutputSchemas } from '../common/output-schemas';

export const getTool = createAction({
  auth: vapiAuth,
  name: 'get_tool',
  classification: 'READ',
  displayName: 'Get Tool',
  description: 'Get the details of a tool by its ID.',
  audience: 'both',
  outputSchema: vapiOutputSchemas.tool,
  aiMetadata: {
    description:
      'Returns one Vapi tool by ID: type, function name and description, and server URL. Server secrets and headers are removed from the output. Get the ID from Find Tool. Read-only.',
    idempotent: true,
  },
  props: {
    toolId: Property.ShortText({ displayName: 'Tool ID', description: 'ID of the tool.', required: true }),
  },
  async run(context) {
    const id = vapiUtils.requireId({ value: context.propsValue.toolId, fieldName: 'Tool ID' });
    const item = await vapiApi.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/tool/${id}`,
      operation: 'get tool',
    });
    return vapiUtils.stripSecrets(item);
  },
});
