import { Property, createAction } from '@activepieces/pieces-framework';
import { encodings } from '../common/encodings';

export const changeFileEncoding = createAction({
  name: 'change_file_encoding',
  displayName: 'Change File Encoding',
  description: 'Changes the encoding of a file',
  props: {
    inputFile: Property.File({
      displayName: 'Source file',
      required: true,
    }),
    inputEncoding: Property.StaticDropdown({
      displayName: 'Source encoding',
      required: true,
      options: {
        options: encodings,
      },
    }),
    outputFileName: Property.ShortText({
      displayName: 'Output file name',
      required: true,
    }),
    outputEncoding: Property.StaticDropdown({
      displayName: 'Output encoding',
      required: true,
      options: {
        options: encodings,
      },
    }),
  },
  async run(context) {
    const inputFile = context.propsValue.inputFile.data;
    const inputEncoding = context.propsValue.inputEncoding as BufferEncoding;
    const outputFileName = context.propsValue.outputFileName;
    const outputEncoding = context.propsValue.outputEncoding as BufferEncoding;

    // First decode the input buffer using the source encoding
    const decodedString = inputFile.toString(inputEncoding);
    // Then encode to the target encoding
    const encodedBuffer = Buffer.from(decodedString, outputEncoding);

    return context.files.write({
      fileName: outputFileName,
      data: encodedBuffer,
    });
  },
});
