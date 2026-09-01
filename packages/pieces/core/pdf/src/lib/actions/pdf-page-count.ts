import { createAction, Property } from '@activepieces/pieces-framework';
import { PDFDocument } from 'pdf-lib';
import { pdfPageCountActionOutputSchema } from '../output-schemas';

export const pdfPageCount = createAction({
  audience: 'both',
  name: 'pdfPageCount',
  classification: 'READ',
  displayName: 'PDF Page Count',
  description: 'Get page count of PDF file.',
  aiMetadata: { description: 'Returns the number of pages in a PDF given as an uploaded file or a URL. Use it as a cheap pre-check before any paging, splitting or looping logic — Extract PDF Pages performs the actual splitting and Extract Text pulls the content. Requires a loadable, non-encrypted PDF; read-only and idempotent.', idempotent: true },
  outputSchema: pdfPageCountActionOutputSchema,
  props: {
    file: Property.File({
      displayName: 'PDF File or URL',
      required: true,
    }),
  },
  errorHandlingOptions: {
    continueOnFailure: {
      defaultValue: false,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  async run({ propsValue }) {
    try {
      const pdfDoc = await PDFDocument.load(propsValue.file.data as any);
      return pdfDoc.getPageCount();
    } catch (error) {
      throw new Error(`Failed to get page count: ${(error as Error).message}`);
    }
  },
});
