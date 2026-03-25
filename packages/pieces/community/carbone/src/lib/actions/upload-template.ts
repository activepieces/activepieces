import FormData from 'form-data';
import { carboneAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { CARBONE_API_URL, CARBONE_VERSION } from '../common/constants';


export const uploadTemplateAction = createAction({
  auth: carboneAuth,
  name: 'carbone_upload_template',
  displayName: 'Upload Template',
  description: 'Upload a template file to Carbone and get a template ID for rendering.',
  props: {
    file: Property.File({
      displayName: 'Template File',
      required: true,
      description:
        'Supported formats: DOCX, XLSX, ODS, ODT, PPTX, CSV, HTML.',
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
    tags: Property.Array({
      displayName: 'Tags (optional)',
      required: false,
      description: 'Tags to categorize the template (e.g. "v1", "2024").',
      properties: {
        tag: Property.ShortText({
          displayName: 'Tag',
          required: true,
        })
      }
    }),
  },
  async run(context) {
    const { file, filename, versioning, existingTemplateId, name, comment, category, tags } = context.propsValue;

    // Metadata fields must come before the template file in Carbone v5
    const form = new FormData();
    if (versioning !== undefined) form.append('versioning', String(versioning));
    if (existingTemplateId) form.append('id', existingTemplateId);
    if (name) form.append('name', name);
    if (comment) form.append('comment', comment);
    if (category) form.append('category', category);
    if (tags && tags.length > 0) form.append('tags', JSON.stringify(tags.map((t) => (t as { tag: string }).tag)));

    // Template file must be last in Carbone v5
    form.append('template', Buffer.from(file.base64, 'base64'), filename);

    const response = await httpClient.sendRequest<{
      success: boolean;
      data: {
        id?: string;
        versionId?: string;
        templateId?: string;
        type: string;
        size: number;
        createdAt: number;
      };
      error?: string;
    }>({
      method: HttpMethod.POST,
      url: `${CARBONE_API_URL}/template`,
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
        'carbone-version': CARBONE_VERSION,
        ...form.getHeaders(),
      },
      body: form as unknown as Record<string, unknown>,
    });

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
