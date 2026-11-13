import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { fileToUploadInput, regionOf, sharedProps, webhookOf } from '../common/props';
import { runAndStoreResult } from '../common/runner';
import { iloveSchemas } from '../common/schemas';

export const rotateImageAction = createAction({
  auth: iloveapiAuth,
  name: 'rotate_image',
  classification: 'READ',
  displayName: 'Rotate Image',
  description: 'Rotate an image by 90, 180 or 270 degrees.',
  audience: 'both',
  outputSchema: iloveSchemas.toolResult,
  aiMetadata: {
    description:
      'Rotate an image clockwise by 90, 180 or 270 degrees with iLoveIMG and store the result as a new file. Each run spends credits.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'Image',
      required: true,
    }),
    rotation: Property.StaticDropdown({
      displayName: 'Rotation',
      required: true,
      defaultValue: 90,
      options: {
        disabled: false,
        options: [
          { label: '90° clockwise', value: 90 },
          { label: '180°', value: 180 },
          { label: '270° (90° counter-clockwise)', value: 270 },
        ],
      },
    }),
    ...sharedProps,
  },
  async run(context) {
    const { file, rotation, output_filename, packaged_filename } = context.propsValue;
    const rotate = ROTATIONS.find((value) => value === Number(rotation));
    if (rotate === undefined) {
      throw new Error('Rotation must be 90, 180 or 270.');
    }

    return await runAndStoreResult({
      auth: context.auth.secret_text,
      region: regionOf(context.propsValue.region),
      webhook: webhookOf(context.propsValue.webhook_url),
      files: context.files,
      tool: 'rotateimage',
      uploads: [fileToUploadInput({ file: file, label: 'Image' })],
      perFileOverrides: [{ rotate }],
      output_filename,
      packaged_filename,
    });
  },
});

const ROTATIONS = [90, 180, 270] as const;
