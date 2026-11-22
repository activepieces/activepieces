import { createAction, Property } from '@activepieces/pieces-framework';
import { vapiAuth } from '../auth';
import { vapiUtils } from '../common/vapi-api';
import { vapiResources } from '../common/props';
import { vapiOutputSchemas } from '../common/output-schemas';

export const listFiles = createAction({
  auth: vapiAuth,
  name: 'list_files',
  classification: 'SEARCH',
  displayName: 'List Files',
  description: 'List the files in your Vapi organization, newest first.',
  audience: 'human',
  outputSchema: vapiOutputSchemas.listFiles,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of files to return (1-1000). Defaults to 100.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const items = await vapiResources.list({
      apiKey: context.auth.secret_text,
      path: '/file',
      operation: 'list files',
      limit: vapiUtils.clampLimit({ value: context.propsValue.limit, defaultValue: 100, max: 1000 }),
    });
    return { files: items };
  },
});
