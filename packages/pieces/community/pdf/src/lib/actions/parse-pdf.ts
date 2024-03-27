import { createAction, Property } from '@activepieces/pieces-framework';
import { readPdfText } from 'pdf-text-reader';

export const parsePdf = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'prasePdf',
  displayName: 'Parse text',
  description: 'Parses texts from PDF file or url',
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
