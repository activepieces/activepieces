import FormData from 'form-data';
import { carboneAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { carboneClient } from '../common/client';
import { carboneProps } from '../common/props';


export const uploadTemplateAction = createAction({
  auth: carboneAuth,
  name: 'carbone_upload_template',
  classification: 'WRITE',
  displayName: 'Upload Template',
  description: 'Upload a template file to Carbone and get a template ID for rendering.',
  audience: 'both',
  aiMetadata: {
    description: 'Uploads a template file (DOCX, XLSX, ODS, ODT, PPTX, CSV, or HTML) to Carbone and returns a template ID used later by the render action. Operates in two modes: by default it creates a new versioned template, or when an existing template ID is supplied it adds the file as a new version of that template and deploys it immediately. Use before rendering when the target template is not yet stored in Carbone. Not idempotent: each call uploads a new template or template version.',
    idempotent: false,
  },
  outputSchema: {
    fields: [
      { key: 'templateId', label: 'Template ID' },
      { key: 'versionId', label: 'Version ID' },
      { key: 'filename', label: 'File Name' },
      { key: 'type', label: 'File Type' },
      { key: 'size', label: 'Size', format: 'filesize' },
      { key: 'createdAt', label: 'Created At (Unix)', format: 'number' },
    ],
  },
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
      description: 'Add this upload as a new version of an existing template ID.',
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
    const trimmedFilename = filename.trim();
    if (trimmedFilename.length === 0) {
      throw new Error('Filename is required, for example invoice-template.docx.');
    }
    const existingId = existingTemplateId?.trim();
    if (existingId && versioning === false) {
      throw new Error('Existing Template ID only works when Enable Versioning is on.');
    }

    const form = new FormData();
    form.append('versioning', String(versioning !== false));
    if (existingId) {
      form.append('id', existingId);
      form.append('deployedAt', String(DEPLOY_NOW_TIMESTAMP));
    }
    const trimmedName = name?.trim();
    if (trimmedName) form.append('name', trimmedName);
    const trimmedComment = comment?.trim();
    if (trimmedComment) form.append('comment', trimmedComment);
    const trimmedCategory = category?.trim();
    if (trimmedCategory) form.append('category', trimmedCategory);
    const tagList = carboneProps.readTags(tags);
    if (tagList && tagList.length > 0) form.append('tags', JSON.stringify(tagList));
    form.append('template', Buffer.from(file.base64, 'base64'), trimmedFilename);

    const response = await carboneClient.request<{
      success: boolean;
      data?: {
        id?: string;
        versionId?: string;
        templateId?: string;
        type?: string;
        size?: number;
        createdAt?: number;
      };
    }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/template',
      operation: 'upload template',
      headers: form.getHeaders(),
      body: form,
      timeoutMs: carboneClient.RENDER_TIMEOUT_MS,
    });
    const data = response.body.data ?? {};

    return {
      templateId: data.id ?? data.templateId ?? null,
      versionId: data.versionId ?? null,
      filename: trimmedFilename,
      type: data.type ?? null,
      size: data.size ?? null,
      createdAt: data.createdAt ?? null,
    };
  },
});

const DEPLOY_NOW_TIMESTAMP = 42000000000;
