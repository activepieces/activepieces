import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { placidAuth } from '../common/auth';
import { placidApiCall } from '../common/client';

export const createPdfAction = createAction({
  name: 'create-pdf',
  auth: placidAuth,
  displayName: 'Create PDF',
  description: 'Generate a PDF from one or more templates using input data.',
  props: {
    webhook_success: Property.ShortText({
      displayName: 'Webhook Success URL',
      required: false,
      description:
        'Placid will send a POST request to this URL after PDF is generated.',
    }),
    passthrough: Property.ShortText({
      displayName: 'Passthrough',
      required: false,
      description:
        'Extra data returned in subsequent webhook callbacks (max 1024 chars).',
    }),
    pages: Property.Json({
      displayName: 'Pages',
      required: false,
      description: `Array of pages with \`template_uuid\` and \`layers\`. Example:\n\`\`\`json\n[\n  {\n    "template_uuid": "tpl-abc123",\n    "layers": {\n      "title": { "text": "Hello" },\n      "image": { "image": "https://..." }\n    }\n  }\n]\n\`\`\``,
    }),
    modifications_filename: Property.ShortText({
      displayName: 'Filename',
      required: false,
      description: 'Filename of the generated PDF (e.g. "my-doc.pdf").',
    }),
    modifications_image_quality: Property.StaticDropdown({
      displayName: 'Image Quality',
      required: false,
      defaultValue: 'high',
      options: {
        disabled: false,
        options: [
          { label: 'High (default)', value: 'high' },
          { label: 'Medium', value: 'medium' },
          { label: 'Low', value: 'low' },
        ],
      },
    }),
    modifications_dpi: Property.StaticDropdown({
      displayName: 'DPI',
      required: false,
      defaultValue: '96',
      options: {
        disabled: false,
        options: [
          { label: '96 (default)', value: '96' },
          { label: '150', value: '150' },
          { label: '300', value: '300' },
        ],
      },
    }),
    modifications_color_mode: Property.StaticDropdown({
      displayName: 'Color Mode',
      required: false,
      defaultValue: 'rgb',
      options: {
        disabled: false,
        options: [
          { label: 'RGB', value: 'rgb' },
          { label: 'CMYK', value: 'cmyk' },
        ],
      },
    }),
    modifications_color_profile: Property.StaticDropdown({
      displayName: 'Color Profile (Beta)',
      required: false,
      defaultValue: 'none',
      options: {
        disabled: false,
        options: [
          { label: 'None', value: 'none' },
          { label: 'sRGB IEC61966-2.1', value: 'rgb-profile-1' },
          { label: 'Adobe RGB (1998)', value: 'rgb-profile-2' },
          { label: 'ProPhoto RGB', value: 'rgb-profile-3' },
          { label: 'ISO Coated v2 (ECI)', value: 'cmyk-profile-1' },
          { label: 'ISO Coated v2 300% (ECI v2)', value: 'cmyk-profile-2' },
          { label: 'Coated FOGRA39 300%', value: 'cmyk-profile-3' },
          { label: 'U.S. Web Coated (SWOP 2006) 3v2', value: 'cmyk-profile-4' },
          { label: 'Japan Color 2 Coated', value: 'cmyk-profile-5' },
        ],
      },
    }),
    to: Property.StaticDropdown({
      displayName: 'Transfer Destination',
      required: false,
      defaultValue: 's3',
      options: {
        disabled: false,
        options: [{ label: 'Amazon S3', value: 's3' }],
      },
    }),
    key: Property.ShortText({
      displayName: 'AWS Access Key',
      required: false,
    }),
    secret: Property.ShortText({
      displayName: 'AWS Secret Key',
      required: false,
    }),
    token: Property.ShortText({
      displayName: 'AWS STS Token (Optional)',
      required: false,
    }),
    region: Property.ShortText({
      displayName: 'Region',
      required: false,
      defaultValue: 'us-east-1',
    }),
    bucket: Property.ShortText({
      displayName: 'Bucket Name',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'File Path',
      required: false,
      description: 'e.g. `pdfs/output.pdf` (will overwrite existing files)',
    }),
    endpoint: Property.ShortText({
      displayName: 'S3 Endpoint',
      required: false,
      defaultValue: 'https://s3.amazonaws.com',
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      required: false,
      defaultValue: 'public',
      options: {
        disabled: false,
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Private', value: 'private' },
        ],
      },
    }),
  },
  async run({ propsValue, auth }) {
    try {
      const {
        webhook_success,
        passthrough,
        pages,
        modifications_filename,
        modifications_image_quality,
        modifications_dpi,
        modifications_color_mode,
        modifications_color_profile,
        to,
        key,
        secret,
        token,
        region,
        bucket,
        path,
        endpoint,
        visibility,
      } = propsValue;

      const modifications: Record<string, any> = {};
      if (modifications_filename)
        modifications['filename'] = modifications_filename;
      if (modifications_image_quality)
        modifications['image_quality'] = modifications_image_quality;
      if (modifications_dpi) modifications['dpi'] = modifications_dpi;
      if (modifications_color_mode)
        modifications['color_mode'] = modifications_color_mode;
      if (modifications_color_profile)
        modifications['color_profile'] = modifications_color_profile;

      const transfer: Record<string, any> = {
        to,
        key,
        secret,
        region,
        bucket,
        path,
        visibility,
      };
      if (token) transfer['token'] = token;
      if (endpoint) transfer['endpoint'] = endpoint;

      const body = {
        webhook_success,
        passthrough,
        pages,
        modifications: Object.keys(modifications).length
          ? modifications
          : undefined,
        transfer,
      };

      const response = await placidApiCall({
        apiKey: auth,
        method: HttpMethod.POST,
        resourceUri: '/pdfs',
        body,
      });

      return {
        success: true,
        message: 'PDF created successfully',
        response,
      };
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      switch (status) {
        case 400:
          throw new Error(`Bad Request: ${message}`);
        case 401:
          throw new Error('Unauthorized: Invalid API key.');
        case 404:
          throw new Error('Not Found: Check template UUID or page data.');
        case 429:
          throw new Error('Rate limit exceeded. Try again later.');
        case 500:
          throw new Error('Server error. Try again.');
        default:
          throw new Error(
            `Placid API Error (${status || 'Unknown'}): ${message}`
          );
      }
    }
  },
});
