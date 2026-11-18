import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfcrowdAuth } from '../common/auth';
import { baseName, conversionOutputSchema, pdfcrowdConvert, requireFile, withExtension } from '../common/convert';

export const editPdfPagesAction = createAction({
  auth: pdfcrowdAuth,
  name: 'edit_pdf_pages',
  displayName: 'Extract or Remove PDF Pages',
  description: 'Create a new PDF that keeps only, or leaves out, the pages you list.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Builds a new PDF from one PDF file with Pdfcrowd: mode "extract" keeps only the listed pages, mode "delete" keeps every page except the listed ones. Pages are a comma-separated list of numbers or ranges, e.g. "1,3-5" or "2-" (page 2 to the end). The original file is not changed. Returns the new PDF as a file reference plus its page count. Each call consumes Pdfcrowd credits.',
    idempotent: false,
  },
  outputSchema: conversionOutputSchema,
  props: {
    pdf: Property.File({ displayName: 'PDF File', required: true }),
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      required: true,
      defaultValue: 'extract',
      options: {
        options: [
          { label: 'Keep only these pages', value: 'extract' },
          { label: 'Remove these pages', value: 'delete' },
        ],
      },
    }),
    pages: Property.ShortText({
      displayName: 'Pages',
      description: 'Comma-separated pages or ranges, e.g. 1,3-5 or 2- (to the end).',
      required: true,
    }),
    filename: Property.ShortText({
      displayName: 'File Name',
      description: 'Name of the new PDF. Defaults to pages.pdf.',
      required: false,
    }),
  },
  async run({ auth, propsValue, files }) {
    const mode = propsValue.mode;
    if (mode !== 'extract' && mode !== 'delete') {
      throw new Error('Mode must be extract or delete.');
    }
    const pages = propsValue.pages?.trim();
    if (!pages) {
      throw new Error('Pages is required, e.g. 1,3-5.');
    }
    return pdfcrowdConvert({
      auth,
      files,
      fields: { input_format: 'pdf', action: mode, page_range: pages },
      attachments: [requireFile({ value: propsValue.pdf, label: 'PDF File', field: 'f_1' })],
      filename: withExtension({ name: baseName({ name: propsValue.filename, fallback: 'pages' }), fallback: 'pages', extension: 'pdf' }),
    });
  },
});
