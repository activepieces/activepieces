import { createAction, Property } from '@activepieces/pieces-framework';
import { vapiAuth } from '../auth';
import { vapiUtils } from '../common/vapi-api';
import { vapiResources } from '../common/props';
import { vapiOutputSchemas } from '../common/output-schemas';

export const listTools = createAction({
  auth: vapiAuth,
  name: 'list_tools',
  classification: 'SEARCH',
  displayName: 'List Tools',
  description: 'List the tools in your Vapi organization, newest first.',
  audience: 'human',
  outputSchema: vapiOutputSchemas.listTools,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of tools to return (1-1000). Defaults to 100.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const items = await vapiResources.list({
      apiKey: context.auth.secret_text,
      path: '/tool',
      operation: 'list tools',
      limit: vapiUtils.clampLimit({ value: context.propsValue.limit, defaultValue: 100, max: 1000 }),
    });
    return { tools: items };
  },
});
