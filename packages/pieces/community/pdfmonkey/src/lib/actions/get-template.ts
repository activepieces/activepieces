import { createAction } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../common/auth';
import { pdfmonkeyOperations } from '../common/operations';
import { pdfmonkeySchemas } from '../common/output-schemas';
import { templateIdText } from '../common/props';

export const getTemplateAction = createAction({
  auth: pdfmonkeyAuth,
  name: 'get_template',
  classification: 'READ',
  displayName: 'Get Template',
  description: 'Get a template with its HTML, test data and page settings.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets one PDFMonkey template by template ID, including its published HTML/Liquid body and its sample (test) data. Read the sample data to learn which payload fields Generate Document expects. Read-only.',
    idempotent: true,
  },
  outputSchema: pdfmonkeySchemas.template,
  props: { template_id: templateIdText },
  async run({ auth, propsValue }) {
    return pdfmonkeyOperations.getTemplate({ auth, templateId: propsValue.template_id });
  },
});
