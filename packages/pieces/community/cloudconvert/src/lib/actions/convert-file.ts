import { createAction, Property, ApFile } from '@activepieces/pieces-framework';
import { cloudconvertAuth } from '../common/auth';
import { cloudConvertApiService } from '../common/api'; 

export const convertFile = createAction({
  auth: cloudconvertAuth,
  name: 'convert_file',
  displayName: 'Convert a File',
  description: 'Converts a file from one format to another.',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to be converted.',
      required: true,
    }),
    output_format: Property.ShortText({
      displayName: 'Output Format',
      description: 'The target format (e.g., "pdf", "png", "jpg").',
      required: true,
    }),
  },

  async run({ auth, propsValue }) {
    const { file, output_format } = propsValue;

    return await cloudConvertApiService.convert(auth, {
      file: file as ApFile,
      output_format: output_format as string,
    });
  },
});
