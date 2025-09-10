import { createAction, Property, ApFile } from '@activepieces/pieces-framework';
import { cloudconvertAuth } from '../common/auth';
import { cloudConvertApiService } from '../common/api'; 

export const mergeFiles = createAction({
  auth: cloudconvertAuth,
  name: 'merge_files',
  displayName: 'Merge Files to PDF',
  description: 'Combine multiple documents or images into a single PDF.',
  props: {
    files: Property.Array({
      displayName: 'Files',
      description:
        'The files to merge (e.g., from a previous step). The order is preserved.',
      required: true,
    }),
    output_filename: Property.ShortText({
      displayName: 'Output Filename',
      description:
        'Optional: The desired filename for the final PDF (e.g., "merged-document.pdf").',
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const { files, output_filename } = propsValue;
    const fileArray = files as ApFile[];

    if (fileArray.length < 2) {
      throw new Error(
        "The 'Merge Files' action requires at least two files to be provided."
      );
    }

    return await cloudConvertApiService.merge(auth, {
      files: fileArray,
      output_filename: output_filename as string | undefined,
    });
  },
});
