import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { fileToUploadInput, regionOf, sharedProps, webhookOf } from '../common/props';
import { runAndStoreResult } from '../common/runner';
import { iloveSchemas } from '../common/schemas';

export const resizeImageAction = createAction({
  auth: iloveapiAuth,
  name: 'resize_image',
  classification: 'READ',
  displayName: 'Resize Image',
  description: 'Resize an image by exact pixels or by percentage.',
  audience: 'both',
  outputSchema: iloveSchemas.toolResult,
  aiMetadata: {
    description:
      'Resize an image with iLoveIMG, either to a width/height in pixels (optionally keeping the aspect ratio) or by a percentage of the original size. Pixel mode needs at least a width or a height; percentage mode needs the percentage. Each run creates a new file and spends credits.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'Image',
      required: true,
    }),
    resize_mode: Property.StaticDropdown({
      displayName: 'Resize Mode',
      required: true,
      defaultValue: 'pixels',
      options: {
        disabled: false,
        options: [
          { label: 'By pixels', value: 'pixels' },
          { label: 'By percentage', value: 'percentage' },
        ],
      },
    }),
    pixels_width: Property.Number({
      displayName: 'Width (px)',
      description: 'Used with "By pixels".',
      required: false,
    }),
    pixels_height: Property.Number({
      displayName: 'Height (px)',
      description: 'Used with "By pixels".',
      required: false,
    }),
    maintain_ratio: Property.Checkbox({
      displayName: 'Keep Aspect Ratio',
      description: 'Used with "By pixels".',
      required: false,
      defaultValue: true,
    }),
    percentage: Property.Number({
      displayName: 'Percentage',
      description: 'Used with "By percentage". 1 to 1000.',
      required: false,
    }),
    no_enlarge_if_smaller: Property.Checkbox({
      displayName: 'Do Not Enlarge Smaller Images',
      required: false,
      defaultValue: true,
    }),
    ...sharedProps,
  },
  async run(context) {
    const {
      file,
      resize_mode,
      pixels_width,
      pixels_height,
      maintain_ratio,
      percentage,
      no_enlarge_if_smaller,
      output_filename,
      packaged_filename,
    } = context.propsValue;

    const options: Record<string, unknown> = {
      resize_mode,
      no_enlarge_if_smaller: no_enlarge_if_smaller ?? true,
    };
    if (resize_mode === 'percentage') {
      if (percentage === undefined || percentage === null || !Number.isInteger(percentage) || percentage < 1 || percentage > 1000) {
        throw new Error('"Percentage" must be a whole number between 1 and 1000 in percentage mode.');
      }
      options['percentage'] = percentage;
    } else if (resize_mode === 'pixels') {
      const width = positiveInt({ value: pixels_width, label: 'Width (px)' });
      const height = positiveInt({ value: pixels_height, label: 'Height (px)' });
      if (width === undefined && height === undefined) {
        throw new Error('Give a width, a height or both in pixel mode.');
      }
      options['maintain_ratio'] = maintain_ratio ?? true;
      if (width !== undefined) options['pixels_width'] = width;
      if (height !== undefined) options['pixels_height'] = height;
    } else {
      throw new Error('Resize Mode must be "pixels" or "percentage".');
    }

    return await runAndStoreResult({
      auth: context.auth.secret_text,
      region: regionOf(context.propsValue.region),
      webhook: webhookOf(context.propsValue.webhook_url),
      files: context.files,
      tool: 'resizeimage',
      uploads: [fileToUploadInput({ file: file, label: 'Image' })],
      options,
      output_filename,
      packaged_filename,
    });
  },
});

function positiveInt({ value, label }: { value: number | undefined | null; label: string }): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`"${label}" must be a whole number, 1 or more.`);
  }
  return value;
}
