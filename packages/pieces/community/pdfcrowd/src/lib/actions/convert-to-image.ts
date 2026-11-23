import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { pdfcrowdAuth } from '../common/auth';
import { baseName, conversionOutputSchema, pdfcrowdConvert, pickSource, withExtension } from '../common/convert';

export const convertToImageAction = createAction({
  auth: pdfcrowdAuth,
  name: 'convert_to_image',
  displayName: 'Convert to Image',
  description: 'Take a screenshot of a web page or HTML as an image.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Renders either a public web page (URL) or an HTML string to an image (PNG, JPG or WebP) with Pdfcrowd, e.g. for previews, thumbnails or social cards. Give exactly one of URL or HTML. Width defaults to 1024 px; without a height the whole page is captured. Returns the image as a file reference. Each call is a fresh conversion that creates a new file and consumes Pdfcrowd credits.',
    idempotent: false,
  },
  outputSchema: conversionOutputSchema,
  propertyGroups: [
    { key: 'source', display: 'section', label: 'Source', icon: 'file', props: ['source_info', 'url', 'html'] },
    { key: 'image', display: 'section', label: 'Image', icon: 'sliders', props: ['output_format', 'screenshot_width', 'screenshot_height'] },
  ],
  props: {
    source_info: Property.MarkDown({ value: 'Give a URL or HTML, not both.', variant: MarkdownVariant.INFO }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'Address of a public web page.',
      placeholder: 'https://example.com',
      required: false,
    }),
    html: Property.LongText({
      displayName: 'HTML',
      description: 'The HTML page to capture.',
      placeholder: '<h1>Hello</h1>',
      required: false,
    }),
    output_format: Property.StaticDropdown({
      displayName: 'Image Format',
      required: true,
      defaultValue: 'png',
      display: 'cards',
      options: {
        options: [
          { label: 'PNG', value: 'png', description: 'Lossless' },
          { label: 'JPG', value: 'jpg', description: 'Smaller files' },
          { label: 'WebP', value: 'webp', description: 'Modern, small' },
        ],
      },
    }),
    screenshot_width: Property.Number({
      displayName: 'Width',
      description: 'In pixels, 96 to 65000. Empty: 1024.',
      width: 'half',
      required: false,
    }),
    screenshot_height: Property.Number({
      displayName: 'Height',
      description: 'In pixels. Empty: the full page height.',
      width: 'half',
      required: false,
    }),
    filename: Property.ShortText({
      displayName: 'File Name',
      description: 'Name of the image file. Empty: screenshot.',
      placeholder: 'screenshot',
      required: false,
    }),
  },
  async run({ auth, propsValue, files }) {
    const source = pickSource({ url: propsValue.url, html: propsValue.html });
    const format = propsValue.output_format ?? 'png';
    if (!['png', 'jpg', 'webp'].includes(format)) {
      throw new Error('Image Format must be png, jpg or webp.');
    }
    const width = optionalInteger({ value: propsValue.screenshot_width, label: 'Width' });
    const height = optionalInteger({ value: propsValue.screenshot_height, label: 'Height' });
    if (width !== undefined && (width < 96 || width > 65000)) {
      throw new Error('Width must be between 96 and 65000 pixels.');
    }
    if (height !== undefined && height < 1) {
      throw new Error('Height must be a positive number of pixels.');
    }
    return pdfcrowdConvert({
      auth,
      files,
      filename: withExtension({ name: baseName({ name: propsValue.filename, fallback: 'screenshot' }), fallback: 'screenshot', extension: format }),
      fields: {
        ...source,
        output_format: format,
        screenshot_width: width,
        screenshot_height: height,
      },
    });
  },
});

function optionalInteger({ value, label }: { value: unknown; label: string }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${label} must be a whole number of pixels.`);
  }
  return parsed;
}
