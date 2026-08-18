import { Property, createAction } from '@activepieces/pieces-framework';
import mime from 'mime-types';

export const filesOutput = {
  Text: 'text',
  Base64: 'base64',
};

export const readFileAction = createAction({
  audience: 'both',
  name: 'read_file',
  displayName: 'Read File',
  description: 'Read a file from the file system',
  aiMetadata: { description: 'Decodes an input file and returns its contents as either UTF-8 text or a base64 string, selected by the output-format option. Use it to turn a file from a trigger or earlier step into a usable value - Text for text-based files such as .txt/.json, Base64 for binary files or API payloads; use Create File for the reverse direction, and Convert CSV to JSON in the CSV piece when you need parsed rows. Requires a file input and an output format (any other value errors); read-only and idempotent.', idempotent: true },
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    file: Property.File({
      displayName: 'File',
      required: true,
    }),
    readOptions: Property.StaticDropdown({
      displayName: 'Output format',
      description: 'The output format',
      required: true,
      options: {
        options: [
          { label: 'Text', value: filesOutput.Text },
          { label: 'Base64', value: filesOutput.Base64 },
        ],
      },
    }),
  },
  async run(context) {
    const file = context.propsValue.file;
    const readOptions = context.propsValue.readOptions;
    switch (readOptions) {
      case filesOutput.Base64: {
        const mimeType = file.extension ? mime.lookup(file.extension) || 'application/octet-stream' : 'application/octet-stream';
        return {
          base64WithMimeType: `data:${mimeType};base64,${file.data.toString('base64')}`,
          base64: file.data.toString('base64'),
        };
      }
      case filesOutput.Text:
        return {
          text: file.data.toString('utf-8'),
        };
      default:
        throw new Error(`Invalid output format: ${readOptions}`);
    }
  },
});
