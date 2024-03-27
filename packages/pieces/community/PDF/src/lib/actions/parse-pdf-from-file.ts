import { createAction, Property } from '@activepieces/pieces-framework';
import { readPdfText } from 'pdf-text-reader';

export const parsePdfFromFile = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'parsePdfFromFile',
  displayName: 'Parse text from PDF file',
  description: 'Parses texts from PDF files',
  props: {
    file: Property.File({
      displayName: 'PDF File',
      required: true,
    }),
  },
  async run(context) {
    // Action logic here
    const file = context.propsValue.file;

    const pdfText = await readPdfText({ data: file.data.buffer });

    return pdfText;
  },
});
