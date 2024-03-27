import { createAction, Property } from '@activepieces/pieces-framework';
import { readPdfText } from 'pdf-text-reader';

export const parsePdfFromUrl = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'parsePdfFromUrl',
  displayName: 'Parse text from PDF URL',
  description: 'Downloads PDF file from internet and parses the text',
  props: {
    'file-url': Property.ShortText({
      displayName: 'PDF File URL',
      required: true,
    }),
  },
  async run(context) {
    // Action logic here
    const fileURL = context.propsValue['file-url'];
    
    const pdfText = await readPdfText({ url: fileURL });

    return pdfText;
  },
});
