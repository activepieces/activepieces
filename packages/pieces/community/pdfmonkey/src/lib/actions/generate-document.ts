import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../common/auth';
import { pdfmonkeyOperations } from '../common/operations';
import { pdfmonkeySchemas } from '../common/output-schemas';
import { templateIdDropdown } from '../common/props';

export const generateDocumentAction = createAction({
  auth: pdfmonkeyAuth,
  name: 'generateDocument',
  classification: 'WRITE',
  displayName: 'Generate Document',
  description: 'Generates a new document using a specified template.',
  audience: 'human',
  aiMetadata: {
    description:
      'Generates a PDF document in PDFMonkey from a template picked in a dropdown and a JSON payload, with optional meta, file name and draft or pending status; can wait for the finished file. Each call creates a new document.',
    idempotent: false,
  },
  outputSchema: pdfmonkeySchemas.wrappedDocument,
  props: {
    document_template_id: templateIdDropdown,
    payload: Property.Json({
      displayName: 'Payload',
      description: 'Data to use for the Document generation.',
      required: true,
    }),
    meta: Property.Json({
      displayName: 'Meta',
      description: 'Meta-Data to attach to the Document.',
      required: false,
    }),
    fileName: Property.ShortText({
      displayName: 'Custom File Name',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Document Status',
      description: 'Draft only saves the document; Pending generates the file right away.',
      required: false,
      defaultValue: 'draft',
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Pending', value: 'pending' },
        ],
      },
    }),
    wait_for_completion: Property.Checkbox({
      displayName: 'Wait for Completion',
      description: 'Generate now and wait (up to 7 minutes) until the file is ready, so the output has the download URL. Overrides Document Status.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const document = await pdfmonkeyOperations.createDocument({
      auth,
      templateId: propsValue.document_template_id,
      payload: propsValue.payload,
      meta: propsValue.meta,
      filename: propsValue.fileName,
      status: propsValue.status,
      waitForCompletion: propsValue.wait_for_completion === true,
    });
    return { document };
  },
});
