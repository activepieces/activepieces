import { Property, createAction } from '@activepieces/pieces-framework';
import { encodings } from '../common/encodings';
import { changeFileEncodingActionOutputSchema } from '../output-schemas';

export const changeFileEncoding = createAction({
  audience: 'both',
  name: 'change_file_encoding',
  classification: 'READ',
  displayName: 'Change File Encoding',
  description: 'Convert a file from one text encoding to another.',
  aiMetadata: { description: 'Re-encodes the bytes of a file from one character encoding to another (e.g. latin1 to utf8), writing the result to a new file under the output name you give. Use it when a downstream step mis-reads a file because of its character set; use Read File to simply get the content as text, or Create File to build a file from a string. The declared source encoding must actually match the file, since it is decoded blindly - a wrong choice silently corrupts characters rather than failing; deterministic and idempotent.', idempotent: true },
  outputSchema: changeFileEncodingActionOutputSchema,
  props: {
    inputFile: Property.File({
      displayName: 'Source File',
      description: 'Pick a file from an earlier step or paste a URL to download.',
      required: true,
    }),
    inputEncoding: Property.StaticDropdown({
      displayName: 'Source Encoding',
      description: 'The encoding the file is in now. A wrong choice garbles characters.',
      required: true,
      options: {
        options: encodings,
      },
    }),
    outputFileName: Property.ShortText({
      displayName: 'Output File Name',
      description: 'Include the file extension.',
      placeholder: 'converted.txt',
      required: true,
    }),
    outputEncoding: Property.StaticDropdown({
      displayName: 'Output Encoding',
      description: 'The encoding the new file is saved in. UTF-8 works almost everywhere.',
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

    const decodedString = inputFile.toString(inputEncoding);
    const encodedBuffer = Buffer.from(decodedString, outputEncoding);

    return context.files.write({
      fileName: outputFileName,
      data: encodedBuffer,
    });
  },
});
