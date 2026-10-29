import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfcrowdAuth } from '../common/auth';
import { baseName, conversionOutputSchema, pdfcrowdConvert, requireFile } from '../common/convert';

export const pdfToImageAction = createAction({
  auth: pdfcrowdAuth,
  name: 'pdf_to_image',
  displayName: 'Convert PDF to Image',
  description: 'Render PDF pages as images. Several pages come back as one ZIP file.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Renders the pages of a PDF file to images (PNG, JPG or WebP) with Pdfcrowd. Optionally limit to some pages ("1", "2-4", "1,3") and set the resolution in DPI (default 144; 72-96 for screen, 300 for print). If one page is rendered the output is a single image file; if several pages are rendered the output is a ZIP file with one image per page (the file name ends in .zip). Returns a file reference plus the page count. Each call consumes Pdfcrowd credits.',
    idempotent: false,
  },
  outputSchema: conversionOutputSchema,
  props: {
    pdf: Property.File({ displayName: 'PDF File', required: true }),
    output_format: Property.StaticDropdown({
      displayName: 'Image Format',
      required: true,
      defaultValue: 'png',
      options: {
        options: [
          { label: 'PNG', value: 'png' },
          { label: 'JPG', value: 'jpg' },
          { label: 'WebP', value: 'webp' },
        ],
      },
    }),
    pages: Property.ShortText({
      displayName: 'Pages',
      description: 'Pages to render, e.g. 1 or 2-4 or 1,3. Leave empty for all pages.',
      required: false,
    }),
    dpi: Property.Number({
      displayName: 'Resolution (DPI)',
      description: 'Defaults to 144. Use 72-96 for screen, 300 for print.',
      required: false,
    }),
    filename: Property.ShortText({
      displayName: 'File Name',
      description: 'Name without extension (.zip when several pages). Defaults to page.',
      required: false,
    }),
  },
  async run({ auth, propsValue, files }) {
    const format = propsValue.output_format ?? 'png';
    if (!['png', 'jpg', 'webp'].includes(format)) {
      throw new Error('Image Format must be png, jpg or webp.');
    }
    const dpi = propsValue.dpi === undefined || propsValue.dpi === null ? undefined : Number(propsValue.dpi);
    if (dpi !== undefined && (!Number.isInteger(dpi) || dpi < 1)) {
      throw new Error('Resolution must be a positive whole number.');
    }
    const name = baseName({ name: propsValue.filename, fallback: 'page' });
    return pdfcrowdConvert({
      auth,
      files,
      fields: {
        input_format: 'pdf',
        output_format: format,
        print_page_range: propsValue.pages?.trim(),
        dpi,
      },
      attachments: [requireFile({ value: propsValue.pdf, label: 'PDF File', field: 'file' })],
      filename: (contentType) => `${name}.${contentType.toLowerCase().includes('zip') ? 'zip' : format}`,
    });
  },
});
