import { createAction, Property } from '@activepieces/pieces-framework';
import pdfParse from 'pdf-parse';

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
    const dataBuffer = Buffer.from(file.data.buffer);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  },
});
