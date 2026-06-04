import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { fileToUploadInput, sharedProps } from '../common/props';
import { runAndStoreResult } from '../common/runner';

export const rotatePdfAction = createAction({
  auth: iloveapiAuth,
  name: 'rotate_pdf',
  displayName: 'Rotate PDF',
  description: 'Rotate every page of a PDF by 90, 180, or 270 degrees.',
  props: {
    file: Property.File({
      displayName: 'PDF File',
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
    const { file, rotation, output_filename, packaged_filename } =
      context.propsValue;

    const rotateValue = rotation as 90 | 180 | 270;

    return await runAndStoreResult({
      auth: context.auth.secret_text,
      files: context.files,
      tool: 'rotate',
      uploads: [fileToUploadInput(file)],
      perFileOverrides: [{ rotate: rotateValue }],
      output_filename,
      packaged_filename,
    });
  },
});
