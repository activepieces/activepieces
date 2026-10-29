import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { fileToUploadInput, regionOf, sharedProps, webhookOf } from '../common/props';
import { runAndStoreResult } from '../common/runner';
import { iloveSchemas } from '../common/schemas';

export const convertImageAction = createAction({
  auth: iloveapiAuth,
  name: 'convert_image',
  classification: 'READ',
  displayName: 'Convert Image',
  description: 'Convert an image to JPG, PNG, GIF, animated GIF or HEIC.',
  audience: 'both',
  outputSchema: iloveSchemas.toolResult,
  aiMetadata: {
    description:
      'Convert an image to another format with iLoveIMG: jpg, png, gif, gif_animation or heic. Each run creates a new file and spends credits.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'Image',
      required: true,
    }),
    to: Property.StaticDropdown({
      displayName: 'Target Format',
      required: true,
      defaultValue: 'jpg',
      options: {
        disabled: false,
        options: [
          { label: 'JPG', value: 'jpg' },
          { label: 'PNG', value: 'png' },
          { label: 'GIF', value: 'gif' },
          { label: 'Animated GIF', value: 'gif_animation' },
          { label: 'HEIC', value: 'heic' },
        ],
      },
    }),
    ...sharedProps,
  },
  async run(context) {
    const { file, to, output_filename, packaged_filename } = context.propsValue;
    if (!FORMATS.includes(String(to))) {
      throw new Error(`Target Format must be one of: ${FORMATS.join(', ')}.`);
    }

    return await runAndStoreResult({
      auth: context.auth.secret_text,
      region: regionOf(context.propsValue.region),
      webhook: webhookOf(context.propsValue.webhook_url),
      files: context.files,
      tool: 'convertimage',
      uploads: [fileToUploadInput({ file: file, label: 'Image' })],
      options: { to },
      output_filename,
      packaged_filename,
    });
  },
});

const FORMATS = ['jpg', 'png', 'gif', 'gif_animation', 'heic'];
