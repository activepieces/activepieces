import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfcrowdAuth } from '../common/auth';
import { baseName, conversionOutputSchema, pdfcrowdConvert, requireFile, withExtension } from '../common/convert';

export const imageToPdfAction = createAction({
  auth: pdfcrowdAuth,
  name: 'image_to_pdf',
  displayName: 'Convert Image to PDF',
  description: 'Turn an image (PNG, JPG, GIF, TIFF, WebP and more) into a PDF.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Converts one image file into a PDF with Pdfcrowd. Optional page size (A3, A4, A5, Letter; Pdfcrowd default when empty), orientation, one margin for all sides (e.g. 10mm), and fit mode: "fit" scales the image to the page keeping proportions, "stretch" fills the page ignoring proportions, "default" keeps the original size. Returns the PDF as a file reference. Each call consumes Pdfcrowd credits.',
    idempotent: false,
  },
  outputSchema: conversionOutputSchema,
  props: {
    image: Property.File({ displayName: 'Image File', required: true }),
    page_size: Property.StaticDropdown({
      displayName: 'Page Size',
      description: 'Leave empty for the Pdfcrowd default.',
      required: false,
      options: {
        options: ['A3', 'A4', 'A5', 'Letter'].map((v) => ({ label: v, value: v })),
      },
    }),
    orientation: Property.StaticDropdown({
      displayName: 'Orientation',
      required: false,
      options: {
        options: [
          { label: 'Portrait', value: 'portrait' },
          { label: 'Landscape', value: 'landscape' },
        ],
      },
    }),
    fit: Property.StaticDropdown({
      displayName: 'Fit',
      required: false,
      options: {
        options: [
          { label: 'Original size', value: 'default' },
          { label: 'Fit to page', value: 'fit' },
          { label: 'Stretch to page', value: 'stretch' },
        ],
      },
    }),
    margin: Property.ShortText({
      displayName: 'Margin',
      description: 'Margin on all four sides with a unit, e.g. 10mm or 0.5in.',
      required: false,
    }),
    filename: Property.ShortText({
      displayName: 'File Name',
      description: 'Name of the PDF. Defaults to image.pdf.',
      required: false,
    }),
  },
  async run({ auth, propsValue, files }) {
    const margin = propsValue.margin?.trim();
    return pdfcrowdConvert({
      auth,
      files,
      fields: {
        input_format: 'image',
        page_size: propsValue.page_size,
        orientation: propsValue.orientation,
        print_page_mode: propsValue.fit,
        margin_top: margin,
        margin_right: margin,
        margin_bottom: margin,
        margin_left: margin,
      },
      attachments: [requireFile({ value: propsValue.image, label: 'Image File', field: 'file' })],
      filename: withExtension({ name: baseName({ name: propsValue.filename, fallback: 'image' }), fallback: 'image', extension: 'pdf' }),
    });
  },
});
