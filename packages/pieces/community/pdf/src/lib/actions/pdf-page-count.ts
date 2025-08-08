import { createAction, Property } from '@activepieces/pieces-framework';
import { PDFDocument } from 'pdf-lib';

export const pdfPageCount = createAction({
  name: 'pdfPageCount',
  displayName: 'PDF Page Count',
  description: 'Get page count of PDF file.',
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
      const pdfDoc = await PDFDocument.load(propsValue.file.data);
      return pdfDoc.getPageCount();
    } catch (error) {
      throw new Error(`Failed to get page count: ${(error as Error).message}`);
    }
  },
});
