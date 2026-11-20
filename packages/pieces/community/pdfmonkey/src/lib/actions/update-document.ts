import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../common/auth';
import { pdfmonkeyOperations } from '../common/operations';
import { pdfmonkeySchemas } from '../common/output-schemas';
import { documentIdText } from '../common/props';

export const updateDocumentAction = createAction({
  auth: pdfmonkeyAuth,
  name: 'update_document',
  classification: 'WRITE',
  displayName: 'Update Document',
  description: 'Change a document\'s data, metadata, file name or template, and optionally generate it again.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates a PDFMonkey document by document ID: replaces its payload and/or meta, sets a new file name or template, and with generate=true queues it for (re)generation. Fields left empty are not changed; a new file name keeps the other meta keys. Use Get Document afterwards to see when generation finished.',
    idempotent: false,
  },
  outputSchema: pdfmonkeySchemas.document,
  props: {
    document_id: documentIdText,
    keep_info: Property.MarkDown({
      value: 'Fields left empty keep their current value.',
      variant: MarkdownVariant.INFO,
    }),
    template_id: Property.ShortText({
      displayName: 'Template ID',
      description: 'Switch to another template. Find IDs with List Templates.',
      placeholder: '07fdc6bb-8eff-4d1a-9cc6-9083775905df',
      required: false,
    }),
    payload: Property.Json({
      displayName: 'Payload',
      description: 'New data for the document. Replaces the whole payload.',
      required: false,
    }),
    meta: Property.Json({
      displayName: 'Meta',
      description: 'New metadata. Replaces all existing meta keys.',
      required: false,
    }),
    file_name: Property.ShortText({
      displayName: 'Custom File Name',
      description: 'New name for the generated file.',
      placeholder: 'Invoice 2026-001.pdf',
      required: false,
    }),
    generate: Property.Checkbox({
      displayName: 'Generate Now',
      description: 'Queue the document to generate again after the update.',
      required: false,
      defaultValue: false,
    }),
  },
  propertyGroups: [
    { key: 'document', display: 'section', label: 'Document', icon: 'file', props: ['document_id'] },
    { key: 'changes', display: 'section', label: 'Changes', icon: 'sliders', props: ['keep_info', 'template_id', 'file_name', 'payload', 'meta', 'generate'] },
  ],
  async run({ auth, propsValue }) {
    return pdfmonkeyOperations.updateDocument({
      auth,
      documentId: propsValue.document_id,
      templateId: propsValue.template_id,
      payload: propsValue.payload,
      meta: propsValue.meta,
      filename: propsValue.file_name,
      generate: propsValue.generate === true,
    });
  },
});
