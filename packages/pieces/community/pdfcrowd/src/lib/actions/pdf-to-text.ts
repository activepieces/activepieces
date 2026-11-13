import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfcrowdAuth } from '../common/auth';
import { baseName, pdfcrowdConvertWithData, requireFile, textConversionOutputSchema, withExtension } from '../common/convert';

export const pdfToTextAction = createAction({
  auth: pdfcrowdAuth,
  name: 'pdf_to_text',
  displayName: 'Extract Text from PDF',
  description: 'Get the text of a PDF as plain text and as a .txt file.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Extracts the text of a PDF file with Pdfcrowd and returns it directly in the text field (plus a .txt file reference). Optionally limit to some pages ("1", "2-4", "1,3"), ignore the visual layout to get text in reading order, and remove end-of-line hyphenation. Works on PDFs that contain text; scanned images give no text. Each call consumes Pdfcrowd credits.',
    idempotent: false,
  },
  outputSchema: textConversionOutputSchema,
  props: {
    pdf: Property.File({ displayName: 'PDF File', required: true }),
    pages: Property.ShortText({
      displayName: 'Pages',
      description: 'Pages to extract, e.g. 1 or 2-4 or 1,3. Leave empty for all pages.',
      required: false,
    }),
    no_layout: Property.Checkbox({
      displayName: 'Ignore Layout',
      description: 'Return text in reading order instead of keeping the page layout.',
      required: false,
    }),
    remove_hyphenation: Property.Checkbox({
      displayName: 'Remove Hyphenation',
      description: 'Join words split by a hyphen at the end of a line.',
      required: false,
    }),
    filename: Property.ShortText({
      displayName: 'File Name',
      description: 'Name of the text file. Defaults to document.txt.',
      required: false,
    }),
  },
  async run({ auth, propsValue, files }) {
    const { result, data } = await pdfcrowdConvertWithData({
      auth,
      files,
      fields: {
        input_format: 'pdf',
        output_format: 'txt',
        print_page_range: propsValue.pages?.trim(),
        no_layout: propsValue.no_layout,
        remove_hyphenation: propsValue.remove_hyphenation,
      },
      attachments: [requireFile({ value: propsValue.pdf, label: 'PDF File', field: 'file' })],
      filename: withExtension({ name: baseName({ name: propsValue.filename, fallback: 'document' }), fallback: 'document', extension: 'txt' }),
    });
    return { text: data.toString('utf-8'), ...result };
  },
});
