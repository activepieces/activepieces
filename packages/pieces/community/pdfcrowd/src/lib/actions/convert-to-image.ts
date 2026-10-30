import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfcrowdAuth } from '../common/auth';
import { conversionOutputSchema, pdfcrowdConvert, pickSource, withExtension } from '../common/convert';

export const convertToImageAction = createAction({
  auth: pdfcrowdAuth,
  name: 'convert_to_image',
  displayName: 'Convert to Image',
  description: 'Take a screenshot of a web page URL or an HTML string as an image file.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Renders either a public web page (URL) or an HTML string to an image (PNG, JPG or WebP) with Pdfcrowd, e.g. for previews, thumbnails or social cards. Give exactly one of URL or HTML. Width defaults to 1024 px; without a height the whole page is captured. Returns the image as a file reference. Each call is a fresh conversion that creates a new file and consumes Pdfcrowd credits.',
    idempotent: false,
  },
  outputSchema: conversionOutputSchema,
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'http(s) address of the page to capture. Leave empty when giving HTML.',
      required: false,
    }),
    html: Property.LongText({
      displayName: 'HTML',
      description: 'HTML markup to render. Leave empty when giving a URL.',
      required: false,
    }),
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
    screenshot_width: Property.Number({
      displayName: 'Width (px)',
      description: 'Image width in pixels, 96 to 65000. Defaults to 1024.',
      required: false,
    }),
    screenshot_height: Property.Number({
      displayName: 'Height (px)',
      description: 'Image height in pixels. Leave empty to capture the full page height.',
      required: false,
    }),
    filename: Property.ShortText({
      displayName: 'File Name',
      description: 'Name of the image file. Defaults to screenshot.',
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
      filename: withExtension({ name: propsValue.filename, fallback: 'screenshot', extension: format }),
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
