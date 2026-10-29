import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { fileToUploadInput, regionOf, sharedProps, webhookOf } from '../common/props';
import { runAndStoreResult } from '../common/runner';
import { iloveSchemas } from '../common/schemas';

const GRAVITIES = [
  'North',
  'NorthEast',
  'NorthWest',
  'Center',
  'CenterEast',
  'CenterWest',
  'East',
  'West',
  'South',
  'SouthEast',
  'SouthWest',
];

export const watermarkImageAction = createAction({
  auth: iloveapiAuth,
  name: 'watermark_image',
  classification: 'READ',
  displayName: 'Watermark Image',
  description: 'Stamp a logo or picture as a watermark on an image.',
  audience: 'both',
  outputSchema: iloveSchemas.toolResult,
  aiMetadata: {
    description:
      'Stamp a watermark picture (for example a logo, JPG or PNG) on an image with iLoveIMG. Position is a gravity such as Center or SouthEast; size is a percent of the base image. Text watermarks are not supported on images; use Watermark PDF for text. Each run creates a new file and spends credits.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'Image',
      required: true,
    }),
    image: Property.File({
      displayName: 'Watermark Image',
      description: 'JPG or PNG to stamp on the image, for example a logo.',
      required: true,
    }),
    gravity: Property.StaticDropdown({
      displayName: 'Position',
      required: false,
      defaultValue: 'Center',
      options: {
        disabled: false,
        options: GRAVITIES.map((value) => ({ label: value, value })),
      },
    }),
    width_percent: Property.Number({
      displayName: 'Width (% of image width)',
      description: '1 to 100. Default 30.',
      required: false,
    }),
    height_percent: Property.Number({
      displayName: 'Height (% of image height)',
      description: '1 to 100. Default 30.',
      required: false,
    }),
    rotation: Property.Number({
      displayName: 'Rotation (degrees)',
      description: '0 to 360.',
      required: false,
    }),
    transparency: Property.Number({
      displayName: 'Opacity (%)',
      description: '1 (almost invisible) to 100 (solid). Default 100.',
      required: false,
    }),
    mosaic: Property.Checkbox({
      displayName: 'Mosaic',
      description: 'Repeat the watermark across the whole image.',
      required: false,
      defaultValue: false,
    }),
    ...sharedProps,
  },
  async run(context) {
    const {
      file,
      image,
      gravity,
      width_percent,
      height_percent,
      rotation,
      transparency,
      mosaic,
      output_filename,
      packaged_filename,
    } = context.propsValue;

    if (gravity && !GRAVITIES.includes(gravity)) {
      throw new Error(`Position must be one of: ${GRAVITIES.join(', ')}.`);
    }
    const width = percent({ value: width_percent, label: 'Width', min: 1 }) ?? 30;
    const height = percent({ value: height_percent, label: 'Height', min: 1 }) ?? 30;
    const opacity = percent({ value: transparency, label: 'Opacity', min: 1 }) ?? 100;
    if (rotation !== undefined && rotation !== null && (rotation < 0 || rotation > 360)) {
      throw new Error('Rotation must be between 0 and 360 degrees.');
    }
    const stamp = fileToUploadInput({ file: image, label: 'Watermark Image' });

    return await runAndStoreResult({
      auth: context.auth.secret_text,
      region: regionOf(context.propsValue.region),
      webhook: webhookOf(context.propsValue.webhook_url),
      files: context.files,
      tool: 'watermarkimage',
      uploads: [fileToUploadInput({ file: file, label: 'Image' })],
      extraUploads: [stamp],
      options: (extras) => ({
        elements: [
          {
            type: 'image',
            server_filename: extras[0],
            gravity: gravity ?? 'Center',
            width_percent: width,
            height_percent: height,
            x_pos_percent: 0,
            y_pos_percent: 0,
            rotation: rotation ?? 0,
            transparency: opacity,
            mosaic: mosaic ?? false,
          },
        ],
      }),
      output_filename,
      packaged_filename,
    });
  },
});

function percent({ value, label, min }: { value: number | undefined | null; label: string; min: number }): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Number.isFinite(value) || value < min || value > 100) {
    throw new Error(`${label} must be between ${min} and 100 percent.`);
  }
  return value;
}
