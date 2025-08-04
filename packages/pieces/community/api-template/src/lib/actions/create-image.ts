import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { apitemplateAuth } from '../../index';

export const apitemplateCreateImageAction = createAction({
  auth: apitemplateAuth,
  name: 'create_image',
  displayName: 'Create Image',
  description: 'Generate an image from a template using JSON overrides',
  props: {
    template_id: Property.Dropdown({
      displayName: 'Template',
      description: 'Select a template to use for image generation',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        try {
          const response = await httpClient.sendRequest<{
            status: string;
            templates: Array<{
              template_id: string;
              name: string;
              status: string;
              format: string;
              created_at: string;
              updated_at: string;
              group_name: string;
            }>;
          }>({
            method: HttpMethod.GET,
            url: 'https://rest.apitemplate.io/v2/list-templates',
            headers: {
              'X-API-KEY': auth as string,
              'Content-Type': 'application/json',
            },
            queryParams: {
              limit: '300',
              format: 'JPEG',
            } as Record<string, string>,
          });

          if (response.status === 200 && response.body.status === 'success') {
            return {
              disabled: false,
              options: response.body.templates
                .filter(template => template.status === 'ACTIVE')
                .map(template => ({
                  label: `${template.name} (${template.format})`,
                  value: template.template_id,
                })),
            };
          }

          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load templates',
          };
        } catch (error) {
          console.error('Error fetching templates:', error);
          return {
            disabled: true,
            options: [],
            placeholder: 'Error loading templates. Please check your API key.',
          };
        }
      },
    }),
    output_image_type: Property.StaticDropdown({
      displayName: 'Output Image Type',
      description: 'Output image type (JPEG or PNG format), default to all',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'All', value: 'all' },
          { label: 'JPEG Only', value: 'jpegOnly' },
          { label: 'PNG Only', value: 'pngOnly' },
        ],
      },
      defaultValue: 'all',
    }),
    expiration: Property.Number({
      displayName: 'Expiration (minutes)',
      description: 'Expiration of the generated image in minutes (0 = store permanently, 1-10080 minutes = 7 days)',
      required: false,
      defaultValue: 0,
    }),
    cloud_storage: Property.StaticDropdown({
      displayName: 'Cloud Storage',
      description: 'Upload the generated images to our storage CDN',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Enabled', value: 1 },
          { label: 'Disabled', value: 0 },
        ],
      },
      defaultValue: 1,
    }),
    generation_delay: Property.Number({
      displayName: 'Generation Delay (ms)',
      description: 'Delay in milliseconds before image generation',
      required: false,
    }),
    resize_images: Property.StaticDropdown({
      displayName: 'Resize Images',
      description: 'Preprocess images or re-size images in the image',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Disabled', value: 0 },
          { label: 'Enabled', value: 1 },
        ],
      },
      defaultValue: 0,
    }),
    resize_max_width: Property.Number({
      displayName: 'Resize Max Width (pixels)',
      description: 'Maximum width of the image in pixels when resize is enabled',
      required: false,
      defaultValue: 1000,
    }),
    resize_max_height: Property.Number({
      displayName: 'Resize Max Height (pixels)',
      description: 'Maximum height of the image in pixels when resize is enabled',
      required: false,
      defaultValue: 1000,
    }),
    resize_format: Property.StaticDropdown({
      displayName: 'Resize Format',
      description: 'Format of the resized image',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'JPEG', value: 'jpeg' },
          { label: 'PNG', value: 'png' },
        ],
      },
      defaultValue: 'jpeg',
    }),
    postaction_s3_filekey: Property.ShortText({
      displayName: 'Post Action S3 File Key',
      description: 'File name for Post Action (AWS S3/Cloudflare R2/Azure Storage). Do not specify file extension.',
      required: false,
    }),
    postaction_s3_bucket: Property.ShortText({
      displayName: 'Post Action S3 Bucket',
      description: 'AWS Bucket for Post Action (AWS S3/Cloudflare R2 Storage) or container for Post Action (Azure Storage)',
      required: false,
    }),
    postaction_enabled: Property.StaticDropdown({
      displayName: 'Post Action Enabled',
      description: 'Enable Post Actions',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Enabled', value: 1 },
          { label: 'Disabled', value: 0 },
        ],
      },
      defaultValue: 1,
    }),
    meta: Property.ShortText({
      displayName: 'Meta',
      description: 'External reference ID for your own reference. It appears in the list-objects API.',
      required: false,
    }),
    overrides: Property.Json({
      displayName: 'JSON Overrides',
      description: 'JSON data with overrides for the template',
      required: true,
      defaultValue: {
        overrides: [
          {
            name: "<object name 1>",
            property_1: "<value 1>",
            property_2: "<value 2>",
            property_3: "<value 3>"
          }
        ]
      },
    }),
  },
  async run(context) {
    const { auth } = context;
    const {
      template_id,
      output_image_type,
      expiration,
      cloud_storage,
      generation_delay,
      resize_images,
      resize_max_width,
      resize_max_height,
      resize_format,
      postaction_s3_filekey,
      postaction_s3_bucket,
      postaction_enabled,
      meta,
      overrides,
    } = context.propsValue;

    const queryParams: Record<string, string | number> = {
      template_id,
    };

    // Add optional query parameters
    if (output_image_type) queryParams['output_image_type'] = output_image_type;
    if (expiration !== undefined) queryParams['expiration'] = expiration;
    if (cloud_storage !== undefined) queryParams['cloud_storage'] = cloud_storage;
    if (generation_delay !== undefined) queryParams['generation_delay'] = generation_delay;
    if (resize_images !== undefined) queryParams['resize_images'] = resize_images;
    if (resize_max_width !== undefined) queryParams['resize_max_width'] = resize_max_width;
    if (resize_max_height !== undefined) queryParams['resize_max_height'] = resize_max_height;
    if (resize_format) queryParams['resize_format'] = resize_format;
    if (postaction_s3_filekey) queryParams['postaction_s3_filekey'] = postaction_s3_filekey;
    if (postaction_s3_bucket) queryParams['postaction_s3_bucket'] = postaction_s3_bucket;
    if (postaction_enabled !== undefined) queryParams['postaction_enabled'] = postaction_enabled;
    if (meta) queryParams['meta'] = meta;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.apitemplate.io/v1/create',
      headers: {
        'X-API-KEY': auth,
        'Content-Type': 'application/json',
      },
      queryParams: queryParams as Record<string, string>,
      body: overrides,
    });

    if (response.status === 200) {
      return response.body;
    }

    throw new Error(`Failed to create image: ${response.status}`);
  },
}); 