import { createAction, Property } from '@activepieces/pieces-framework';
import { extractText as pdfExtractText, getDocumentProxy } from 'unpdf';

export const extractText = createAction({
  audience: 'both',
  name: 'extractText',
  displayName: 'Extract Text',
  description: 'Extract text from PDF file or url',
  aiMetadata: { description: 'Extracts the text layer of a PDF supplied as an uploaded file or a URL, merging every page into a single string. Use this to read a text-based PDF before parsing, classifying or summarizing it; for a scanned/rasterized PDF use Convert to Image plus an OCR or vision step instead, and use PDF Page Count when only the document length matters. Requires a loadable PDF and returns nothing useful when the pages are just embedded scan images; read-only and idempotent.', idempotent: true },
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
