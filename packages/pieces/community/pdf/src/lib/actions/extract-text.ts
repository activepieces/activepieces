import { createAction, Property } from '@activepieces/pieces-framework';
import { readPdfText } from 'pdf-text-reader';

export const extractText = createAction({
  name: 'extractText',
  displayName: 'Extract Text',
  description: 'Extract text from PDF file or url',
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
      hide: true
    },
  },
  async run(context) {
    const file = context.propsValue.file;
    const pdfText = await readPdfText({ data: file.data.buffer });
    return pdfText;
  },
});
