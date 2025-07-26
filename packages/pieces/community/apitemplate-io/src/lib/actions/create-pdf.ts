import { createAction, Property } from '@activepieces/pieces-framework';
import { ApitemplateAuth } from '../common/auth';
import { ApitemplateAuthConfig, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { templateIdDropdown } from '../common/props';

export const createPdf = createAction({
  auth: ApitemplateAuth,
  name: 'createPdf',
  displayName: 'Create PDF',
  description: 'Create a PDF from a template with provided data',
  props: {
    templateId: templateIdDropdown,
    data: Property.Object({
      displayName: 'Template Data',
      description: 'JSON data with overrides array to populate the template. Format: {"overrides": [{"name": "object_name", "property": "value"}]}',
      required: true,
    }),
    
    exportType: Property.StaticDropdown({
      displayName: 'Export Type',
      description: 'Format of the generated response',
      required: false,
      defaultValue: 'json',
      options: {
        options: [
          { label: 'JSON Response', value: 'json' },
          { label: 'Direct PDF URL', value: 'file' },
        ],
      },
    }),
    expiration: Property.Number({
      displayName: 'Expiration (minutes)',
      description: 'Expiration of the generated PDF in minutes. Use 0 to store permanently, or 1-10080 minutes (7 days) to specify expiration.',
      required: false,
      defaultValue: 0,
    }),
    cloudStorage: Property.Checkbox({
      displayName: 'Upload to CDN Storage',
      description: 'Upload generated PDF to storage CDN (default: true). Set to false if using Post Action to upload to your own S3.',
      required: false,
      defaultValue: true,
    }),
    password: Property.ShortText({
      displayName: 'PDF Password',
      description: 'Set a password to protect the generated PDF',
      required: false,
    }),
    generationDelay: Property.Number({
      displayName: 'Generation Delay (ms)',
      description: 'Delay in milliseconds before PDF generation',
      required: false,
    }),
    resizeImages: Property.Checkbox({
      displayName: 'Resize Images',
      description: 'Preprocess or resize images in the PDF',
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
    postactionS3Filekey: Property.ShortText({
      displayName: 'Post Action S3 File Key',
      description: 'Specify the file name for Post Action (AWS S3/Cloudflare R2/Azure Storage). Do not include file extension.',
      required: false,
    }),
    postactionS3Bucket: Property.ShortText({
      displayName: 'Post Action S3 Bucket',
      description: 'Overwrite the AWS Bucket for Post Action or container for Azure Storage',
      required: false,
    }),
    postactionEnabled: Property.Checkbox({
      displayName: 'Enable Post Actions',
      description: 'Enable Post Actions for uploading to your own storage',
      required: false,
      defaultValue: true,
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
      exportType,
      expiration,
      cloudStorage,
      password,
      generationDelay,
      resizeImages,
      resizeMaxWidth,
      resizeMaxHeight,
      resizeFormat,
      postactionS3Filekey,
      postactionS3Bucket,
      postactionEnabled,
      meta,
    } = propsValue;

    // Build query parameters according to API docs
    const queryParams = new URLSearchParams();
    queryParams.append('template_id', templateId);

    if (exportType && exportType !== 'json') {
      queryParams.append('export_type', exportType);
    }

    if (expiration !== undefined && expiration !== 0) {
      queryParams.append('expiration', expiration.toString());
    }

    if (cloudStorage !== undefined) {
      queryParams.append('cloud_storage', cloudStorage ? '1' : '0');
    }

    if (password) {
      queryParams.append('password', password);
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

    if (postactionS3Filekey) {
      queryParams.append('postaction_s3_filekey', postactionS3Filekey);
    }

    if (postactionS3Bucket) {
      queryParams.append('postaction_s3_bucket', postactionS3Bucket);
    }

    if (postactionEnabled !== undefined) {
      queryParams.append('postaction_enabled', postactionEnabled ? '1' : '0');
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