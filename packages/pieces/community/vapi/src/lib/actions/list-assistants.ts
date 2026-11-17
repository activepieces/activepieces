import { createAction, Property } from '@activepieces/pieces-framework';
import { vapiAuth } from '../auth';
import { vapiUtils } from '../common/vapi-api';
import { vapiResources } from '../common/props';
import { vapiOutputSchemas } from '../common/output-schemas';

export const listAssistants = createAction({
  auth: vapiAuth,
  name: 'list_assistants',
  classification: 'SEARCH',
  displayName: 'List Assistants',
  description: 'List the assistants in your Vapi organization, newest first.',
  audience: 'human',
  outputSchema: vapiOutputSchemas.listAssistants,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of assistants to return (1-1000). Defaults to 100.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const items = await vapiResources.list({
      apiKey: context.auth.secret_text,
      path: '/assistant',
      operation: 'list assistants',
      limit: vapiUtils.clampLimit({ value: context.propsValue.limit, defaultValue: 100, max: 1000 }),
    });
    return { assistants: items };
  },
});
