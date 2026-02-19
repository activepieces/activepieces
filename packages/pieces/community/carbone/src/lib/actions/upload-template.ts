import { carboneAuth } from '../../';
import { Property, createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

const CARBONE_API_URL = 'https://api.carbone.io';
const CARBONE_VERSION = '4';

export const uploadTemplateAction = createAction({
  auth: carboneAuth,
  name: 'carbone_upload_template',
  displayName: 'Upload Template',
  description:
    'Upload a template file (DOCX, XLSX, ODS, ODT, PPTX, etc.) to Carbone and receive a template ID for later rendering.',
  props: {
    fileBase64: Property.LongText({
      displayName: 'Template File (Base64)',
      required: true,
      description:
        'The template file encoded as a base64 string. Supported formats: DOCX, XLSX, ODS, ODT, PPTX, ODS, CSV, HTML.',
    }),
    filename: Property.ShortText({
      displayName: 'Filename',
      required: true,
      description:
        'The filename including extension (e.g. `invoice-template.docx`). The extension determines the output format.',
    }),
  },
  async run(context) {
    const { fileBase64, filename } = context.propsValue;

    // Convert base64 to binary buffer
    const fileBuffer = Buffer.from(fileBase64, 'base64');

    // Build multipart form data
    const boundary = `----Carbone${Date.now()}`;
    const CRLF = '\r\n';

    const header =
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="template"; filename="${filename}"${CRLF}` +
      `Content-Type: application/octet-stream${CRLF}${CRLF}`;

    const footer = `${CRLF}--${boundary}--${CRLF}`;

    const headerBuffer = Buffer.from(header, 'utf-8');
    const footerBuffer = Buffer.from(footer, 'utf-8');
    const body = Buffer.concat([headerBuffer, fileBuffer, footerBuffer]);

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${CARBONE_API_URL}/template`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'carbone-version': CARBONE_VERSION,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': String(body.length),
      },
      body: body as unknown as Record<string, unknown>,
    };

    const response = await httpClient.sendRequest<{
      success: boolean;
      data: { templateId: string };
      error?: string;
    }>(request);

    if (!response.body.success) {
      throw new Error(
        `Failed to upload template: ${response.body.error ?? 'Unknown error'}`
      );
    }

    return {
      templateId: response.body.data.templateId,
      filename,
    };
  },
});
