import { createAction, Property, ApFile } from '@activepieces/pieces-framework';
import { cloudconvertAuth } from '../common/auth';
import { cloudConvertApiService } from '../common/api'; 

export const optimizeFile = createAction({
  auth: cloudconvertAuth,
  name: 'optimize_file',
  displayName: 'Optimize a File',
  description:
    'Creates a task to optimize and compress a file (PDF, PNG, or JPG).',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to be optimized (e.g., PDF, PNG, JPG).',
      required: true,
    }),
    profile: Property.StaticDropdown({
      displayName: 'Optimization Profile',
      description:
        'Optional: Choose an optimization profile for specific needs. Defaults to "web".',
      required: false,
      options: {
        options: [
          { label: 'Web (Default)', value: 'web' },
          { label: 'Print', value: 'print' },
          { label: 'Archive', value: 'archive' },
          { label: 'Scanned Images (MRC)', value: 'mrc' },
          { label: 'Maximum Compression', value: 'max' },
        ],
      },
    }),
    engine: Property.ShortText({
      displayName: 'Engine',
      description:
        'Optional: The optimization engine to use (e.g., "jpegoptim", "optipng").',
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const { file, profile, engine } = propsValue;

    return await cloudConvertApiService.optimize(auth, {
      file: file as ApFile,
      profile: profile as string | undefined,
      engine: engine as string | undefined,
    });
  },
});
