import { createAction, Property } from '@activepieces/pieces-framework';
import { ApitemplateAuth } from '../common/auth';
import { ApitemplateAuthConfig, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { templateIdDropdown } from '../common/props';

export const createImage = createAction({
  auth: ApitemplateAuth,
  name: 'createImage',
  displayName: 'Create Image',
  description: 'Create an image from a template with provided data',
  props: {
    templateId: templateIdDropdown,
    data: Property.Object({
      displayName: 'Template Data',
      description: 'JSON data with overrides array to populate the template. Format: {"overrides": [{"name": "object_name", "property": "value"}]}',
      required: true,
    }),
    outputImageType: Property.StaticDropdown({
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
    exportType: Property.StaticDropdown({
      displayName: 'Export Type',
      description: 'Format of the generated response',
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
      displayName: 'Expiration (minutes)',
      description: 'Expiration in minutes (default to 0, store permanently). Use 0 for permanent storage or 1-10080 minutes (7 days).',
      required: false,
      defaultValue: 0,
    }),
    cloudStorage: Property.Checkbox({
      displayName: 'Upload to CDN Storage',
      description: 'Upload generated images to storage CDN (default: true). Set to false if using Post Action to upload to your own S3.',
      required: false,
      defaultValue: true,
    }),
    generationDelay: Property.Number({
      displayName: 'Generation Delay (ms)',
      description: 'Delay in milliseconds before image generation',
      required: false,
    }),
    resizeImages: Property.Checkbox({
      displayName: 'Resize Images',
      description: 'Preprocess or resize images in the template',
      required: false,
      defaultValue: false,
    }),
    resizeMaxWidth: Property.Number({
      displayName: 'Resize Max Width',
      description: 'Maximum width in pixels when resizing images (default: 1000)',
      required: false,
      defaultValue: 1000,
    }),
    resizeMaxHeight: Property.Number({
      displayName: 'Resize Max Height',
      description: 'Maximum height in pixels when resizing images (default: 1000)',
      required: false,
      defaultValue: 1000,
    }),
    resizeFormat: Property.StaticDropdown({
      displayName: 'Resize Format',
      description: 'Format for resized images',
      required: false,
      defaultValue: 'jpeg',
      options: {
        options: [
          { label: 'JPEG', value: 'jpeg' },
          { label: 'PNG', value: 'png' },
        ],
      },
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
      outputImageType,
      exportType,
      expiration,
      cloudStorage,
      generationDelay,
      resizeImages,
      resizeMaxWidth,
      resizeMaxHeight,
      resizeFormat,
      meta,
    } = propsValue;

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('template_id', templateId);

    if (outputImageType && outputImageType !== 'all') {
      queryParams.append('output_image_type', outputImageType);
    }

    if (expiration !== undefined) {
      queryParams.append('expiration', expiration.toString());
    }

    if (cloudStorage !== undefined) {
      queryParams.append('cloud_storage', cloudStorage ? '1' : '0');
    }

    if (generationDelay) {
      queryParams.append('generation_delay', generationDelay.toString());
    }

    if (resizeImages) {
      queryParams.append('resize_images', '1');
      if (resizeMaxWidth) {
        queryParams.append('resize_max_width', resizeMaxWidth.toString());
      }
      if (resizeMaxHeight) {
        queryParams.append('resize_max_height', resizeMaxHeight.toString());
      }
      if (resizeFormat) {
        queryParams.append('resize_format', resizeFormat);
      }
    }

    if (meta) {
      queryParams.append('meta', meta);
    }

    if (exportType) {
      queryParams.append('export_type', exportType);
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