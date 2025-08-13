import { createAction, Property } from '@activepieces/pieces-framework';
import { ApitemplateAuth } from '../common/auth';
import { ApitemplateAuthConfig, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { templateIdDropdown } from '../common/props';

export const createImage = createAction({
  auth: ApitemplateAuth,
  name: 'createImage',
  displayName: 'Create Image',
  description: 'Creates an image from a template with provided data.',
  props: {
    templateId: templateIdDropdown,
        data: Property.Json({
      displayName: 'Template Data',
      description:
        'JSON data with overrides array to populate the template. Format: {"overrides": [{"name": "object_name", "property": "value"}]}.',
      required: true,
    }),
    generationDelay: Property.Number({
      displayName: 'Generation Delay (ms)',
      description: 'Delay in milliseconds before PDF generation',
      required: false,
    }),
    meta: Property.ShortText({
      displayName: 'External Reference ID',
      description: 'Specify an external reference ID for your own reference',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const authConfig = auth as ApitemplateAuthConfig;
    const {
       templateId,
      data,
      generationDelay,
      meta,
    } = propsValue;

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('template_id', templateId);

    if (generationDelay) {
      queryParams.append('generation_delay', generationDelay.toString());
    }

    if (meta) {
      queryParams.append('meta', meta);
    }

    const endpoint = `/create-image?${queryParams.toString()}`;

    const response = await makeRequest(
      authConfig.apiKey,
      HttpMethod.POST,
      endpoint,
      data,
      undefined,
      authConfig.region
    );

    return response;
  },
});