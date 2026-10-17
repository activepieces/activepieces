import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../common/auth';
import { pdfmonkeyOperations } from '../common/operations';
import { pdfmonkeySchemas } from '../common/output-schemas';
import { fileNameProp, metaProp, payloadProp, templateIdText } from '../common/props';

export const generateDocumentAiAction = createAction({
  auth: pdfmonkeyAuth,
  name: 'generate_document_ai',
  classification: 'WRITE',
  displayName: 'Generate Document (AI)',
  description: 'Generate a document from a template ID and wait for the finished file link.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Generates a PDF (or image) in PDFMonkey from a template ID and a JSON payload, with optional meta and file name. By default it waits (up to 7 minutes) and returns the finished document with status "success" and its download URL (valid 1 hour); set wait_for_completion=false to only queue it and poll Get Document. Get the template ID from List Templates and the expected payload fields from Get Template. Every call creates a new document.',
    idempotent: false,
  },
  outputSchema: pdfmonkeySchemas.document,
  props: {
    template_id: templateIdText,
    payload: payloadProp,
    meta: metaProp,
    file_name: fileNameProp,
    wait_for_completion: Property.Checkbox({
      displayName: 'Wait for Completion',
      description: 'Wait until the file is generated and return its download URL.',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    return pdfmonkeyOperations.createDocument({
      auth,
      templateId: propsValue.template_id,
      payload: propsValue.payload,
      meta: propsValue.meta,
      filename: propsValue.file_name,
      status: 'pending',
      waitForCompletion: propsValue.wait_for_completion !== false,
    });
  },
});
