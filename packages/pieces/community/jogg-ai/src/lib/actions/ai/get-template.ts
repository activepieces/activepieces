import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { joggAiAuth } from '../../..';
import { joggAiClient } from '../../common/client';
import { joggAiOutputSchemas } from '../../common/output-schemas';

export const aiGetTemplate = createAction({
  auth: joggAiAuth,
  name: 'ai_get_template',
  displayName: 'Get Template',
  description: 'Gets one of your custom templates and its variables.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: joggAiOutputSchemas.aiGetTemplate,
  aiMetadata: {
    description:
      'Gets one of the account custom video templates by template_id, including the variables (name and type) it expects. Call it before Create Template Video to learn which variable names to fill. Read-only.',
    idempotent: true,
  },
  props: {
    template_id: Property.ShortText({
      displayName: 'Template ID',
      description: 'A numeric template_id from List Templates.',
      required: true,
    }),
  },
  async run(context) {
    const templateId = joggAiClient.toIntegerId({ value: context.propsValue.template_id, label: 'Template ID' });
    return joggAiClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v2/template/custom/${templateId}`,
      op: 'get template',
    });
  },
});
