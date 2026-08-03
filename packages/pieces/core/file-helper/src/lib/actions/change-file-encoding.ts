import { Property, createAction } from '@activepieces/pieces-framework';
import { encodings } from '../common/encodings';

export const changeFileEncoding = createAction({
  audience: 'both',
  name: 'change_file_encoding',
  displayName: 'Change File Encoding',
  description: 'Changes the encoding of a file',
  aiMetadata: { description: 'Re-encodes the bytes of a file from one character encoding to another (e.g. latin1 to utf8), writing the result to a new file under the output name you give. Use it when a downstream step mis-reads a file because of its character set; use Read File to simply get the content as text, or Create File to build a file from a string. The declared source encoding must actually match the file, since it is decoded blindly - a wrong choice silently corrupts characters rather than failing; deterministic and idempotent.', idempotent: true },
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
