import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { apitemplateAuth } from '../../index';

export const apitemplateCreatePdfFromHtmlAction = createAction({
  auth: apitemplateAuth,
  name: 'create_pdf_from_html',
  displayName: 'Create PDF From HTML',
  description: 'Generate a PDF from raw HTML (e.g., invoices built via custom HTML)',
  props: {
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
    expiration: Property.Number({
      displayName: 'Expiration (minutes)',
      description: 'Expiration of the generated PDF in minutes (0 = store permanently, 1-10080 minutes = 7 days)',
      required: false,
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
    body: Property.LongText({
      displayName: 'HTML Body',
      description: 'The HTML body content for the PDF. Supports HTML markup and Jinja2 syntax (e.g., {{name}}). The value of {{name}} will be replaced with the actual value provided in the data object.',
      required: true,
      defaultValue: '<h1>Hello World {{name}}</h1>',
    }),
    css: Property.LongText({
      displayName: 'CSS Styles',
      description: 'The CSS styles to be applied to the PDF. Should contain valid CSS markup and include the style tag.',
      required: false,
      defaultValue: '<style>.bg{background: red;}</style>',
    }),
    data: Property.Json({
      displayName: 'Dynamic Data',
      description: 'The data object containing values for dynamic content in the HTML body. This object should include properties with corresponding values.',
      required: false,
      defaultValue: {
        name: "This is a title"
      },
    }),
    settings: Property.Json({
      displayName: 'PDF Generation Settings',
      description: 'The settings object contains various properties to configure the PDF generation.',
      required: false,
      defaultValue: {
        paper_size: "A4",
        orientation: "1",
        header_font_size: "9px",
        margin_top: "40",
        margin_right: "10",
        margin_bottom: "40",
        margin_left: "10",
        print_background: "1",
        displayHeaderFooter: true,
        custom_header: "<style>#header, #footer { padding: 0 !important; }</style>\n<table style=\"width: 100%; padding: 0px 5px;margin: 0px!important;font-size: 15px\">\n  <tr>\n    <td style=\"text-align:left; width:30%!important;\"><span class=\"date\"></span></td>\n    <td style=\"text-align:center; width:30%!important;\"><span class=\"pageNumber\"></span></td>\n    <td style=\"text-align:right; width:30%!important;\"><span class=\"totalPages\"></span></td>\n  </tr>\n</table>",
        custom_footer: "<style>#header, #footer { padding: 0 !important; }</style>\n<table style=\"width: 100%; padding: 0px 5px;margin: 0px!important;font-size: 15px\">\n  <tr>\n    <td style=\"text-align:left; width:30%!important;\"><span class=\"date\"></span></td>\n    <td style=\"text-align:center; width:30%!important;\"><span class=\"pageNumber\"></span></td>\n    <td style=\"text-align:right; width:30%!important;\"><span class=\"totalPages\"></span></td>\n  </tr>\n</table>"
      },
    }),
  },
  async run(context) {
    const { auth } = context;
    const {
      export_type,
      expiration,
      output_format,
      filename,
      direct_download,
      cloud_storage,
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
      body,
      css,
      data,
      settings,
    } = context.propsValue;

    const queryParams: Record<string, string | number> = {};

    // Add optional query parameters
    if (export_type) queryParams['export_type'] = export_type;
    if (expiration !== undefined) queryParams['expiration'] = expiration;
    if (output_format) queryParams['output_format'] = output_format;
    if (filename) queryParams['filename'] = filename;
    if (direct_download !== undefined) queryParams['direct_download'] = direct_download;
    if (cloud_storage !== undefined) queryParams['cloud_storage'] = cloud_storage;
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

    // Build request body
    const requestBody: Record<string, any> = {
      body,
    };

    if (css) requestBody['css'] = css;
    if (data) requestBody['data'] = data;
    if (settings) requestBody['settings'] = settings;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://rest.apitemplate.io/v2/create-pdf-from-html',
      headers: {
        'X-API-KEY': auth as string,
        'Content-Type': 'application/json',
      },
      queryParams: queryParams as Record<string, string>,
      body: requestBody,
    });

    if (response.status === 200) {
      return response.body;
    }

    throw new Error(`Failed to create PDF from HTML: ${response.status}`);
  },
}); 