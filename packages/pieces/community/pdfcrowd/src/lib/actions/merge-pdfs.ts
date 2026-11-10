import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfcrowdAuth } from '../common/auth';
import { baseName, conversionOutputSchema, fileOf, pdfcrowdConvert, requireFile, withExtension } from '../common/convert';

export const mergePdfsAction = createAction({
  auth: pdfcrowdAuth,
  name: 'merge_pdfs',
  displayName: 'Merge PDFs',
  description: 'Join two or more PDF files into one PDF, in the order given.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Joins two or more PDF files into a single PDF with Pdfcrowd, keeping the order in which they are listed. Each item must be a PDF file (a file reference from an earlier step or a public URL to the file). Returns the merged PDF as a file reference plus the page count. Each call creates a new file and consumes Pdfcrowd credits.',
    idempotent: false,
  },
  outputSchema: conversionOutputSchema,
  props: {
    pdfs: Property.Array({
      displayName: 'PDF Files',
      description: 'The PDFs to merge, in order. At least two.',
      required: true,
      properties: {
        file: Property.File({ displayName: 'PDF File', required: true }),
      },
    }),
    filename: Property.ShortText({
      displayName: 'File Name',
      description: 'Name of the merged PDF. Defaults to merged.pdf.',
      required: false,
    }),
  },
  async run({ auth, propsValue, files }) {
    const items = Array.isArray(propsValue.pdfs) ? propsValue.pdfs : [];
    if (items.length < 2) {
      throw new Error('Provide at least two PDF files to merge.');
    }
    const attachments = items.map((item, index) =>
      requireFile({ value: fileOf(item), label: `PDF file #${index + 1}`, field: `f_${index + 1}` }),
    );
    return pdfcrowdConvert({
      auth,
      files,
      fields: { input_format: 'pdf' },
      attachments,
      filename: withExtension({ name: baseName({ name: propsValue.filename, fallback: 'merged' }), fallback: 'merged', extension: 'pdf' }),
    });
  },
});
