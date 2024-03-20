import { createAction, Property } from '@activepieces/pieces-framework';
import { readPdfText } from 'pdf-text-reader';

export const parseTextFromPdfFile = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'parseTextFromPdfFile',
  displayName: 'Parse text from PDF file',
  description: 'Parses texts from PDF file',
  props: {
    file: Property.LongText({
      displayName: 'PDF File URL',
      required: true,
    }),
  },
  async run(context) {
    // Action logic here
    console.dir(context, { depth: null });

    const file = context.propsValue.file;
    const pdfText = await readPdfText({ url: file });

    return pdfText;
  },
});
