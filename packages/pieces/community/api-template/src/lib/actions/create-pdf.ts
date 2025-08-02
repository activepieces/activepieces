import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { apitemplateAuth } from '../../index';

export const apitemplateCreatePdfAction = createAction({
  auth: apitemplateAuth,
  name: 'create_pdf',
  displayName: 'Create PDF',
  description: 'Generate a PDF using a template and JSON input',
  props: {
    template_id: Property.Dropdown({
      displayName: 'Template',
      description: 'Select a template to use for PDF generation',
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
              format: 'PDF',
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
    export_type: Property.StaticDropdown({
      displayName: 'Export Type',
      description: 'Either file or json (Default). File returns binary data, json returns a JSON object with CDN URL',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'JSON (CDN URL)', value: 'json' },
          { label: 'File (Binary)', value: 'file' },
        ],
      },
      defaultValue: 'json',
    }),
    export_in_base64: Property.StaticDropdown({
      displayName: 'Export in Base64',
      description: 'If export_type = file, download in binary or base64 format',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Binary (Default)', value: 0 },
          { label: 'Base64', value: 1 },
        ],
      },
      defaultValue: 0,
    }),
    expiration: Property.Number({
      displayName: 'Expiration (minutes)',
      description: 'Expiration of the generated PDF in minutes (0 = store permanently, 1-10080 minutes = 7 days)',
      required: false,
      defaultValue: 0,
    }),
    output_html: Property.StaticDropdown({
      displayName: 'Output HTML',
      description: 'Enable output of HTML content in JSON response',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Disabled (Default)', value: 0 },
          { label: 'Enabled', value: 1 },
        ],
      },
      defaultValue: 0,
    }),
    output_format: Property.StaticDropdown({
      displayName: 'Output Format',
      description: 'Specifies the desired output format',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'PDF (Default)', value: 'pdf' },
          { label: 'HTML', value: 'html' },
          { label: 'PNG', value: 'png' },
          { label: 'JPEG', value: 'jpeg' },
        ],
      },
      defaultValue: 'pdf',
    }),
    filename: Property.ShortText({
      displayName: 'Filename',
      description: 'Custom file name (should end with .pdf). Defaults to UUID if not specified',
      required: false,
    }),
    direct_download: Property.StaticDropdown({
      displayName: 'Direct Download',
      description: 'ContentDisposition set to attachment',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Disabled (Default)', value: 0 },
          { label: 'Enabled', value: 1 },
        ],
      },
      defaultValue: 0,
    }),
    cloud_storage: Property.StaticDropdown({
      displayName: 'Cloud Storage',
      description: 'Upload the generated PDFs to our storage CDN',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Enabled (Default)', value: 1 },
          { label: 'Disabled', value: 0 },
        ],
      },
      defaultValue: 1,
    }),
    load_data_from: Property.ShortText({
      displayName: 'Load Data From URL',
      description: 'Load JSON data from a remote URL instead of request body',
      required: false,
    }),
    extract_link: Property.StaticDropdown({
      displayName: 'Extract Links',
      description: 'Extract links from the HTML content',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Disabled (Default)', value: 0 },
          { label: 'Enabled', value: 1 },
        ],
      },
      defaultValue: 0,
    }),
    generation_delay: Property.Number({
      displayName: 'Generation Delay (ms)',
      description: 'Delay in milliseconds before PDF generation',
      required: false,
    }),
    image_resample_res: Property.Number({
      displayName: 'Image Resample Resolution (DPI)',
      description: 'Downsample images to reduce PDF file size. Common values: 72, 96, 150, 300, 600',
      required: false,
    }),
    resize_images: Property.StaticDropdown({
      displayName: 'Resize Images',
      description: 'Preprocess images or re-size images in the PDF',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Disabled (Default)', value: 0 },
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
          { label: 'Enabled (Default)', value: 1 },
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
    async: Property.StaticDropdown({
      displayName: 'Async Generation',
      description: 'Generate PDF asynchronously (requires webhook_url)',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Synchronous (Default)', value: 0 },
          { label: 'Asynchronous', value: 1 },
        ],
      },
      defaultValue: 0,
    }),
    webhook_url: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'URL for webhook callback when using async generation. Must start with http:// or https://',
      required: false,
    }),
    webhook_method: Property.StaticDropdown({
      displayName: 'Webhook Method',
      description: 'The HTTP method of the webhook',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'GET (Default)', value: 'GET' },
          { label: 'POST', value: 'POST' },
        ],
      },
      defaultValue: 'GET',
    }),
    webhook_headers: Property.ShortText({
      displayName: 'Webhook Headers',
      description: 'HTTP headers for webhook (base64 encoded JSON object)',
      required: false,
    }),
    overrides: Property.Json({
      displayName: 'JSON Overrides',
      description: 'JSON data with overrides for the template',
      required: true,
      defaultValue: {
        invoice_number: "INV38379",
        date: "2021-09-30",
        currency: "USD",
        total_amount: 82542.56
      },
    }),
  },
  async run(context) {
    const { auth } = context;
    const {
      template_id,
      export_type,
      export_in_base64,
      expiration,
      output_html,
      output_format,
      filename,
      direct_download,
      cloud_storage,
      load_data_from,
      extract_link,
      generation_delay,
      image_resample_res,
      resize_images,
      resize_max_width,
      resize_max_height,
      resize_format,
      postaction_s3_filekey,
      postaction_s3_bucket,
      postaction_enabled,
      meta,
      async,
      webhook_url,
      webhook_method,
      webhook_headers,
      overrides,
    } = context.propsValue;

    const queryParams: Record<string, string | number> = {
      template_id,
    };

    // Add optional query parameters
    if (export_type) queryParams['export_type'] = export_type;
    if (export_in_base64 !== undefined) queryParams['export_in_base64'] = export_in_base64;
    if (expiration !== undefined) queryParams['expiration'] = expiration;
    if (output_html !== undefined) queryParams['output_html'] = output_html;
    if (output_format) queryParams['output_format'] = output_format;
    if (filename) queryParams['filename'] = filename;
    if (direct_download !== undefined) queryParams['direct_download'] = direct_download;
    if (cloud_storage !== undefined) queryParams['cloud_storage'] = cloud_storage;
    if (load_data_from) queryParams['load_data_from'] = load_data_from;
    if (extract_link !== undefined) queryParams['extract_link'] = extract_link;
    if (generation_delay !== undefined) queryParams['generation_delay'] = generation_delay;
    if (image_resample_res !== undefined) queryParams['image_resample_res'] = image_resample_res;
    if (resize_images !== undefined) queryParams['resize_images'] = resize_images;
    if (resize_max_width !== undefined) queryParams['resize_max_width'] = resize_max_width;
    if (resize_max_height !== undefined) queryParams['resize_max_height'] = resize_max_height;
    if (resize_format) queryParams['resize_format'] = resize_format;
    if (postaction_s3_filekey) queryParams['postaction_s3_filekey'] = postaction_s3_filekey;
    if (postaction_s3_bucket) queryParams['postaction_s3_bucket'] = postaction_s3_bucket;
    if (postaction_enabled !== undefined) queryParams['postaction_enabled'] = postaction_enabled;
    if (meta) queryParams['meta'] = meta;
    if (async !== undefined) queryParams['async'] = async;
    if (webhook_url) queryParams['webhook_url'] = webhook_url;
    if (webhook_method) queryParams['webhook_method'] = webhook_method;
    if (webhook_headers) queryParams['webhook_headers'] = webhook_headers;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://rest.apitemplate.io/v2/create-pdf',
      headers: {
        'X-API-KEY': auth as string,
        'Content-Type': 'application/json',
      },
      queryParams: queryParams as Record<string, string>,
      body: overrides,
    });

    if (response.status === 200) {
      return response.body;
    }

    throw new Error(`Failed to create PDF: ${response.status}`);
  },
}); 