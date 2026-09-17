import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { getTemplateOutputSchema } from '../output-schemas';

export const getTemplate = createAction({
  name: 'get_template',
  classification: 'READ',
  auth: resendAuth,
  displayName: 'Get Template',
  outputSchema: getTemplateOutputSchema,
  description: 'Retrieve a single template by ID or alias',
  audience: 'ai',
  aiMetadata: { description: "Retrieves the full content and metadata of a single email template, by ID or alias, including its HTML/text body and whether it has unpublished changes. Use List Templates to find the ID. Read-only and idempotent.", idempotent: true },
  props: {
    template_id: resendProps.templateId,
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest({ auth: auth.secret_text, method: HttpMethod.GET, path: `/templates/${propsValue.template_id}` });
  },
});
