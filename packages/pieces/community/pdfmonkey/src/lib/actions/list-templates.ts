import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../common/auth';
import { pdfmonkeyOperations } from '../common/operations';
import { pdfmonkeySchemas } from '../common/output-schemas';

export const listTemplatesAction = createAction({
  auth: pdfmonkeyAuth,
  name: 'list_templates',
  classification: 'SEARCH',
  displayName: 'List Templates',
  description: 'List the document templates in your PDFMonkey workspaces.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the PDFMonkey templates of every workspace the API key can access (or of one workspace ID) with its ID, name, output type (pdf or image) and folder. Use it to find the template ID needed by Generate Document or Get Template. Read-only.',
    idempotent: true,
  },
  outputSchema: pdfmonkeySchemas.templateList,
  props: {
    workspace_id: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'Only templates of this workspace. Leave empty to list the templates of every workspace you can access.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return pdfmonkeyOperations.listTemplates({ auth, workspaceId: propsValue.workspace_id });
  },
});
