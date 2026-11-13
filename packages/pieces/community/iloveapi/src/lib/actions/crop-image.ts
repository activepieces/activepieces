import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { fileToUploadInput, regionOf, sharedProps, webhookOf } from '../common/props';
import { runAndStoreResult } from '../common/runner';
import { iloveSchemas } from '../common/schemas';

export const cropImageAction = createAction({
  auth: iloveapiAuth,
  name: 'crop_image',
  classification: 'READ',
  displayName: 'Crop Image',
  description: 'Crop an image to a rectangle given in pixels.',
  audience: 'both',
  outputSchema: iloveSchemas.toolResult,
  aiMetadata: {
    description:
      'Crop an image with iLoveIMG to a rectangle of the given width and height in pixels, starting at the X/Y offset from the top-left corner (default 0,0). Each run creates a new file and spends credits.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'Image',
      required: true,
    }),
    width: Property.Number({
      displayName: 'Width (px)',
      required: true,
    }),
    height: Property.Number({
      displayName: 'Height (px)',
      required: true,
    }),
    x: Property.Number({
      displayName: 'X Offset (px)',
      description: 'Distance from the left edge. Default 0.',
      required: false,
    }),
    y: Property.Number({
      displayName: 'Y Offset (px)',
      description: 'Distance from the top edge. Default 0.',
      required: false,
    }),
    ...sharedProps,
  },
  async run(context) {
    const { file, width, height, x, y, output_filename, packaged_filename } = context.propsValue;
    const options = {
      width: wholeNumber({ value: width, label: 'Width (px)', min: 1 }) ?? 0,
      height: wholeNumber({ value: height, label: 'Height (px)', min: 1 }) ?? 0,
      x: wholeNumber({ value: x, label: 'X Offset (px)', min: 0 }) ?? 0,
      y: wholeNumber({ value: y, label: 'Y Offset (px)', min: 0 }) ?? 0,
    };
    if (options.width < 1 || options.height < 1) {
      throw new Error('Width and Height are required.');
    }

    return await runAndStoreResult({
      auth: context.auth.secret_text,
      region: regionOf(context.propsValue.region),
      webhook: webhookOf(context.propsValue.webhook_url),
      files: context.files,
      tool: 'cropimage',
      uploads: [fileToUploadInput({ file: file, label: 'Image' })],
      options,
      output_filename,
      packaged_filename,
    });
  },
});

function wholeNumber({ value, label, min }: { value: number | undefined | null; label: string; min: number }): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Number.isInteger(value) || value < min) {
    throw new Error(`"${label}" must be a whole number, ${min} or more.`);
  }
  return value;
}
