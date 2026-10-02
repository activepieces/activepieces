import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { presentonAuth } from '../../common/auth';
import { presentonClient } from '../../common/client';
import { presentationGetStandardTemplateOutputSchema } from '../../output-schemas';

export const getStandardTemplate = createAction({
  auth: presentonAuth,
  name: 'presentation_get_standard_template',
  outputSchema: presentationGetStandardTemplateOutputSchema,
  displayName: 'Get Standard Template',
  description: 'Get a standard template with its layouts and schemas.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one standard template, including its slide layouts and the content schema of each layout. Use before presentation_create_presentation_from_json to learn valid layout names and content shapes. Get the template id from presentation_list_standard_templates.',
    idempotent: true,
  },
  props: {
    template_id: Property.ShortText({ displayName: 'Template ID', required: true }),
  },
  async run({ auth, propsValue }) {
    return presentonClient.request<Record<string, unknown>>({
      auth: auth.secret_text,
      method: HttpMethod.GET,
      path: `/api/v3/standard-template/${encodeURIComponent(propsValue.template_id)}`,
    });
  },
});
