import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { presentonAuth } from '../../common/auth';
import { presentonClient } from '../../common/client';
import { presentationGetTemplateExampleOutputSchema } from '../../output-schemas';

export const getTemplateExample = createAction({
  auth: presentonAuth,
  name: 'presentation_get_template_example',
  outputSchema: presentationGetTemplateExampleOutputSchema,
  displayName: 'Get Template Example',
  description: 'Get an example deck for a standard template.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads an example set of slides for a standard template, showing populated content for each layout. Use as a model when writing slides for presentation_create_presentation_from_json. Get the template id from presentation_list_standard_templates.',
    idempotent: true,
  },
  props: {
    template_id: Property.ShortText({ displayName: 'Template ID', required: true }),
  },
  async run({ auth, propsValue }) {
    return presentonClient.request<Record<string, unknown>>({
      auth: auth.secret_text,
      method: HttpMethod.GET,
      path: `/api/v3/standard-template/${encodeURIComponent(propsValue.template_id)}/example`,
    });
  },
});
