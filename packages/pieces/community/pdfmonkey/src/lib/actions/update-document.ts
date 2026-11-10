import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../common/auth';
import { pdfmonkeyOperations } from '../common/operations';
import { pdfmonkeySchemas } from '../common/output-schemas';
import { documentIdText, fileNameProp } from '../common/props';

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
    template_id: Property.ShortText({
      displayName: 'Template ID',
      description: 'Switch the document to another template. Leave empty to keep the current one.',
      required: false,
    }),
    payload: Property.Json({
      displayName: 'Payload',
      description: 'New data for the document, as a JSON object. Replaces the whole payload. Leave empty to keep it.',
      required: false,
    }),
    meta: Property.Json({
      displayName: 'Meta',
      description: 'New metadata, as a JSON object. Replaces all meta keys. Leave empty to keep it.',
      required: false,
    }),
    file_name: fileNameProp,
    generate: Property.Checkbox({
      displayName: 'Generate Now',
      description: 'Queue the document for generation after the update (sets its status to pending).',
      required: false,
      defaultValue: false,
    }),
  },
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
