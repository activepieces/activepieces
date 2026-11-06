import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocApi } from '../common/api';
import { pandadocInputs } from '../common/inputs';
import { pandadocSchemas } from '../common/schemas';

export const getTemplateDetails = createAction({
  auth: pandadocAuth,
  name: 'get_template_details',
  classification: 'READ',
  displayName: 'Get Template Details',
  description: 'Gets a template with its roles, fields and variables.',
  audience: 'both',
  aiMetadata: {
    description:
      'Get one PandaDoc template by ID with its recipient roles, fields (with merge field names) and variables/tokens. Call it before Create Document from Template to learn which roles and field names to pass. Read-only.',
    idempotent: true,
  },
  props: {
    template_id: Property.ShortText({ displayName: 'Template ID', required: true }),
  },
  outputSchema: pandadocSchemas['templateDetails'],
  async run({ auth, propsValue }) {
    return pandadocApi.getTemplateDetails({
      apiKey: auth.secret_text,
      templateId: pandadocInputs.requiredString({ value: propsValue.template_id, label: 'Template ID' }),
    });
  },
});
