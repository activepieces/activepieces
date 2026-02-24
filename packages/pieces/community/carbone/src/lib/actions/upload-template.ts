import { carboneAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

const CARBONE_API_URL = 'https://api.carbone.io';
const CARBONE_VERSION = '5';

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
        'The template file encoded as a base64 string. Supported formats: DOCX, XLSX, ODS, ODT, PPTX, CSV, HTML.',
    }),
    filename: Property.ShortText({
      displayName: 'Filename',
      required: true,
      description:
        'The filename including extension (e.g. `invoice-template.docx`). The extension determines the output format.',
    }),
    versioning: Property.Checkbox({
      displayName: 'Enable Versioning (optional)',
      required: false,
      defaultValue: true,
      description:
        'If enabled (default), creates a template ID that can hold multiple versions. If disabled, creates a standalone template (legacy mode).',
    }),
    existingTemplateId: Property.ShortText({
      displayName: 'Existing Template ID (optional)',
      required: false,
      description:
        'If provided, adds this upload as a new version to an existing template ID. Only works when versioning is enabled.',
    }),
    name: Property.ShortText({
      displayName: 'Template Name (optional)',
      required: false,
      description:
        'Friendly name for the template.',
    }),
    comment: Property.LongText({
      displayName: 'Comment (optional)',
      required: false,
      description:
        'Description or notes about the template.',
    }),
    category: Property.ShortText({
      displayName: 'Category (optional)',
      required: false,
      description:
        'Category/folder to organize templates (e.g. "invoices", "contracts").',
    }),
    tags: Property.Array(Property.ShortText({
      displayName: 'Tag',
      required: true,
    }), {
      displayName: 'Tags (optional)',
      required: false,
      description: 'Tags to categorize the template (e.g. "v1", "2024").',
    }),
  },
  async run(context) {
    const { fileBase64, filename, versioning, existingTemplateId, name, comment, category, tags } = context.propsValue;

    // Convert base64 to binary buffer
    const fileBuffer = Buffer.from(fileBase64, 'base64');

    // Build multipart form data
    const boundary = `----Carbone${Date.now()}`;
    const CRLF = '\r\n';

    const parts: Buffer[] = [];

    // Add metadata fields (must come before template file in v5)
    if (versioning !== undefined) {
      const field = `--${boundary}${CRLF}` +
        `Content-Disposition: form-data; name="versioning"${CRLF}${CRLF}` +
        `${versioning}${CRLF}`;
      parts.push(Buffer.from(field, 'utf-8'));
    }

    if (existingTemplateId) {
      const field = `--${boundary}${CRLF}` +
        `Content-Disposition: form-data; name="id"${CRLF}${CRLF}` +
        `${existingTemplateId}${CRLF}`;
      parts.push(Buffer.from(field, 'utf-8'));
    }

    if (name) {
      const field = `--${boundary}${CRLF}` +
        `Content-Disposition: form-data; name="name"${CRLF}${CRLF}` +
        `${name}${CRLF}`;
      parts.push(Buffer.from(field, 'utf-8'));
    }

    if (comment) {
      const field = `--${boundary}${CRLF}` +
        `Content-Disposition: form-data; name="comment"${CRLF}${CRLF}` +
        `${comment}${CRLF}`;
      parts.push(Buffer.from(field, 'utf-8'));
    }

    if (category) {
      const field = `--${boundary}${CRLF}` +
        `Content-Disposition: form-data; name="category"${CRLF}${CRLF}` +
        `${category}${CRLF}`;
      parts.push(Buffer.from(field, 'utf-8'));
    }

    if (tags && tags.length > 0) {
      const field = `--${boundary}${CRLF}` +
        `Content-Disposition: form-data; name="tags"${CRLF}${CRLF}` +
        `${JSON.stringify(tags)}${CRLF}`;
      parts.push(Buffer.from(field, 'utf-8'));
    }

    // Add template file (must be last in v5)
    const fileHeader =
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="template"; filename="${filename}"${CRLF}` +
      `Content-Type: application/octet-stream${CRLF}${CRLF}`;

    parts.push(Buffer.from(fileHeader, 'utf-8'));
    parts.push(fileBuffer);
    parts.push(Buffer.from(`${CRLF}--${boundary}--${CRLF}`, 'utf-8'));

    const body = Buffer.concat(parts);

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
      data: {
        id?: string;
        versionId?: string;
        templateId?: string; // legacy backward compatibility
        type: string;
        size: number;
        createdAt: number;
      };
      error?: string;
    }>(request);

    if (!response.body.success) {
      throw new Error(
        `Failed to upload template: ${response.body.error ?? 'Unknown error'}`
      );
    }

    return {
      templateId: response.body.data.id ?? response.body.data.templateId,
      versionId: response.body.data.versionId,
      filename,
      type: response.body.data.type,
      size: response.body.data.size,
      createdAt: response.body.data.createdAt,
    };
  },
});
