import { createAction, Property, ApFile } from '@activepieces/pieces-framework';
import { cloudconvertAuth } from '../common/auth';
import { cloudConvertApiService } from '../common/api';

export const archiveFiles = createAction({
  auth: cloudconvertAuth,
  name: 'create_archive',
  displayName: 'Create an Archive',
  description: 'Creates a ZIP, RAR, 7Z, or other archive from multiple files.',
  props: {
    files: Property.Array({
      displayName: 'Files',
      description: 'The files to include in the archive.',
      required: true,
    }),
    output_format: Property.StaticDropdown({
      displayName: 'Archive Format',
      description: 'The desired format for the output archive.',
      required: true,
      options: {
        options: [
          { label: 'ZIP', value: 'zip' },
          { label: 'RAR', value: 'rar' },
          { label: '7Z', value: '7z' },
          { label: 'TAR', value: 'tar' },
          { label: 'TAR.GZ', value: 'tar.gz' },
          { label: 'TAR.BZ2', value: 'tar.bz2' },
        ],
      },
    }),
    output_filename: Property.ShortText({
      displayName: 'Output Filename',
      description:
        'Optional: The desired filename for the archive (e.g., "documents.zip").',
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const { files, output_format, output_filename } = propsValue;

    if (!files || (files as ApFile[]).length === 0) {
      throw new Error('Please provide at least one file to archive.');
    }

    return await cloudConvertApiService.archive(auth, {
      files: files as ApFile[],
      output_format: output_format as string,
      output_filename: output_filename as string | undefined,
    });
  },
});
