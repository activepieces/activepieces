import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfcrowdAuth } from '../common/auth';
import { conversionOutputSchema, pdfcrowdConvert, pickSource, withExtension } from '../common/convert';

export const convertToPdfAiAction = createAction({
  auth: pdfcrowdAuth,
  name: 'convert_to_pdf_ai',
  displayName: 'Convert to PDF',
  description: 'Convert a web page URL or an HTML string to a PDF file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Converts either a public web page (URL) or an HTML string into a PDF file with Pdfcrowd. Give exactly one of URL or HTML. Optional page size, orientation, one margin applied to all sides, and header/footer HTML (use <span class="pdfcrowd-page-number"></span> and <span class="pdfcrowd-page-count"></span> for page numbers). Returns the PDF as a file reference plus page count and remaining credits. Each call is a fresh conversion that creates a new file and consumes Pdfcrowd credits.',
    idempotent: false,
  },
  outputSchema: conversionOutputSchema,
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'http(s) address of the page to convert. Leave empty when giving HTML.',
      required: false,
    }),
    html: Property.LongText({
      displayName: 'HTML',
      description: 'HTML markup to convert. Leave empty when giving a URL.',
      required: false,
    }),
    page_size: Property.StaticDropdown({
      displayName: 'Page Size',
      description: 'Defaults to A4.',
      required: false,
      options: {
        options: ['A3', 'A4', 'A5', 'Letter'].map((v) => ({ label: v, value: v })),
      },
    }),
    orientation: Property.StaticDropdown({
      displayName: 'Orientation',
      description: 'Defaults to portrait.',
      required: false,
      options: {
        options: [
          { label: 'Portrait', value: 'portrait' },
          { label: 'Landscape', value: 'landscape' },
        ],
      },
    }),
    margin: Property.ShortText({
      displayName: 'Margin',
      description: 'Margin on all four sides with a unit, e.g. 10mm. Defaults to 0.4in.',
      required: false,
    }),
    header_html: Property.LongText({
      displayName: 'Header HTML',
      description: 'HTML shown at the top of every page.',
      required: false,
    }),
    footer_html: Property.LongText({
      displayName: 'Footer HTML',
      description: 'HTML shown at the bottom of every page.',
      required: false,
    }),
    filename: Property.ShortText({
      displayName: 'File Name',
      description: 'Name of the PDF file. Defaults to document.pdf.',
      required: false,
    }),
  },
  async run({ auth, propsValue, files }) {
    const source = pickSource({ url: propsValue.url, html: propsValue.html });
    const margin = propsValue.margin?.trim();
    return pdfcrowdConvert({
      auth,
      files,
      filename: withExtension({ name: propsValue.filename, fallback: 'document', extension: 'pdf' }),
      fields: {
        ...source,
        page_size: propsValue.page_size,
        orientation: propsValue.orientation,
        margin_top: margin,
        margin_right: margin,
        margin_bottom: margin,
        margin_left: margin,
        header_html: propsValue.header_html,
        footer_html: propsValue.footer_html,
      },
    });
  },
});
