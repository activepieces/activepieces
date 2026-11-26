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
      description: 'Data merged into the template, as a JSON object.',
      required: true,
    }),
    meta: Property.Json({
      displayName: 'Meta',
      description: 'Extra data kept with the document and returned in its output.',
      required: false,
    }),
    fileName: Property.ShortText({
      displayName: 'Custom File Name',
      description: "Name of the generated file. Empty: PDFMonkey's default name.",
      placeholder: 'Invoice 2026-001.pdf',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Document Status',
      required: false,
      defaultValue: 'draft',
      display: 'cards',
      options: {
        options: [
          { label: 'Draft', value: 'draft', description: 'Save only', icon: 'file' },
          { label: 'Pending', value: 'pending', description: 'Generate now', icon: 'send' },
        ],
      },
    }),
    wait_for_completion: Property.Checkbox({
      displayName: 'Wait for Completion',
      description: 'Wait up to 7 min for the download URL. Overrides Document Status.',
      required: false,
      defaultValue: false,
    }),
  },
  propertyGroups: [
    { key: 'template', display: 'section', label: 'Template and Data', icon: 'file', props: ['document_template_id', 'payload', 'meta'] },
    { key: 'output', display: 'section', label: 'Output', icon: 'send', props: ['fileName', 'status', 'wait_for_completion'] },
  ],
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
