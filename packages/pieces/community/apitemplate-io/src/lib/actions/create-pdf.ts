import { createAction, Property } from '@activepieces/pieces-framework';
import { ApitemplateAuth } from '../common/auth';
import { ApitemplateAuthConfig, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { templateIdDropdown } from '../common/props';

export const createPdf = createAction({
  auth: ApitemplateAuth,
  name: 'createPdf',
  displayName: 'Create PDF',
  description: 'Creates a PDF from a template with provided data.',
  props: {
    templateId: templateIdDropdown,
    data: Property.Json({
      displayName: 'Template Data',
      description:
        'JSON data with overrides array to populate the template. Format: {"overrides": [{"name": "object_name", "property": "value"}]}.',
      required: true,
    }),
    expiration: Property.Number({
      displayName: 'Expiration (minutes)',
      description:
        'Expiration of the generated PDF in minutes. Use 0 to store permanently, or 1-10080 minutes (7 days) to specify expiration.',
      required: false,
      defaultValue: 0,
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
      expiration,
      generationDelay,
      meta,
    } = propsValue;

    // Build query parameters according to API docs
    const queryParams = new URLSearchParams();
    queryParams.append('template_id', templateId);

    if (expiration !== undefined && expiration !== 0) {
      queryParams.append('expiration', expiration.toString());
    }

    if (generationDelay) {
      queryParams.append('generation_delay', generationDelay.toString());
    }

    if (meta) {
      queryParams.append('meta', meta);
    }

    const endpoint = `/create-pdf?${queryParams.toString()}`;

    try {
      const response = await makeRequest(
        authConfig.apiKey,
        HttpMethod.POST,
        endpoint,
        data,
        undefined,
        authConfig.region
      );

      return response;
    } catch (error: any) {
      if (error.message.includes('502') && authConfig.region !== 'default') {
        throw new Error(
          `${error.message}\n\nThe ${authConfig.region} region appears to be experiencing issues. ` +
            `Consider switching to the 'default' region in your authentication settings or try again later.`
        );
      }
      throw error;
    }
  },
});
