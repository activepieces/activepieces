import { createAction, Property } from '@activepieces/pieces-framework';
import { ApitemplateAuth } from '../common/auth';
import { ApitemplateRegion, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { templateIdDropdown } from '../common/props';

export const createImage = createAction({
  auth: ApitemplateAuth,
  name: 'createImage',
  displayName: 'Create Image',
  description: 'Create an image from a template with provided data',
  props: {
    templateId: templateIdDropdown,
    output_image_type: Property.StaticDropdown({
      displayName: 'Output Image Type',
      description: 'Output image type (JPEG or PNG format), default to all',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All formats', value: 'all' },
          { label: 'JPEG only', value: 'jpegOnly' },
          { label: 'PNG only', value: 'pngOnly' },
        ],
      },
    }),
    expiration: Property.Number({
      displayName: 'Expiration (seconds)',
      description:
        'How long the generated image URL should remain valid (in seconds). Default is 3600 seconds (1 hour).',
      required: false,
      defaultValue: 3600,
    }),
    exportType: Property.StaticDropdown({
      displayName: 'Export Type',
      description: 'Format of the generated image',
      required: false,
      defaultValue: 'json',
      options: {
        options: [
          { label: 'JSON Response', value: 'json' },
          { label: 'Direct Image URL', value: 'file' },
        ],
      },
    }),
    expiration: Property.Number({
      displayName: 'Expiration (seconds)',
      description:
        'How long the generated image URL should remain valid (in seconds). Default is 3600 seconds (1 hour).',
      required: false,
    }),
    cloudStorage: Property.Checkbox({
      displayName: 'Save to Cloud Storage',
      description:
        'Whether to save the generated image to your configured cloud storage',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { templateId, exportType, expiration, cloudStorage } = propsValue;

    const requestBody: any = {
      template_id: templateId,
    };

    if (exportType) {
      requestBody.export_type = exportType;
    }

    if (expiration) {
      requestBody.expiration = expiration;
    }

    if (cloudStorage) {
      requestBody.cloud_storage = 1;
    }

    const response = await makeRequest(
      auth.apiKey,
      HttpMethod.POST,
      '/create-image',
      requestBody,
      undefined,
      auth.region as ApitemplateRegion
    );

    return response;
  },
});
