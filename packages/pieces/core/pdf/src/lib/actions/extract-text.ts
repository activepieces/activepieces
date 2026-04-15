import { createAction, Property } from '@activepieces/pieces-framework';
import { extractText as pdfExtractText, getDocumentProxy } from 'unpdf';

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
    const pdf = await getDocumentProxy(new Uint8Array(file.data.buffer));
    const { text } = await pdfExtractText(pdf, { mergePages: true });
    return text;
  },
});
