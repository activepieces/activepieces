import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfcrowdAuth } from '../common/auth';
import { baseName, conversionOutputSchema, pdfcrowdConvert, requireFile, withExtension } from '../common/convert';

export const pdfToHtmlAction = createAction({
  auth: pdfcrowdAuth,
  name: 'pdf_to_html',
  displayName: 'Convert PDF to HTML',
  description: 'Convert a PDF to one HTML file with images and fonts inside.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Converts a PDF file to one self-contained HTML file with Pdfcrowd (images, CSS and fonts embedded), keeping the visual layout. Optionally limit to some pages ("1", "2-4", "1,3"). Returns the HTML as a file reference plus the page count; to get plain text instead, use Extract Text from PDF. Each call consumes Pdfcrowd credits.',
    idempotent: false,
  },
  outputSchema: conversionOutputSchema,
  propertyGroups: [
    { key: 'pdf', display: 'section', label: 'PDF', icon: 'file', props: ['pdf', 'pages'] },
  ],
  props: {
    pdf: Property.File({
      displayName: 'PDF File',
      description: 'The PDF to convert. Upload it or map a file from an earlier step.',
      required: true,
    }),
    pages: Property.ShortText({
      displayName: 'Pages',
      description: 'Pages to convert. Empty: all pages.',
      placeholder: '1-3,5',
      required: false,
    }),
    filename: Property.ShortText({
      displayName: 'File Name',
      description: 'Name of the HTML file. Empty: document.html.',
      placeholder: 'document.html',
      required: false,
    }),
  },
  async run({ auth, propsValue, files }) {
    return pdfcrowdConvert({
      auth,
      files,
      fields: {
        input_format: 'pdf',
        output_format: 'html',
        print_page_range: propsValue.pages?.trim(),
      },
      attachments: [requireFile({ value: propsValue.pdf, label: 'PDF File', field: 'file' })],
      filename: withExtension({ name: baseName({ name: propsValue.filename, fallback: 'document' }), fallback: 'document', extension: 'html' }),
    });
  },
});
