import { Property, createAction } from '@activepieces/pieces-framework';

export const filesOutput = {
  Text: 'text',
  Base64: 'base64',
};

export const readFileAction = createAction({
  name: 'read_file',
  displayName: 'Read File',
  description: 'Read a file from the file system',
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
      case filesOutput.Base64:
        return {
          Base64: file.data.toString('base64'),
        };
      case filesOutput.Text:
        return {
          Text: file.data.toString('utf-8'),
        };
      default:
        throw new Error(`Invalid output format: ${readOptions}`);
    }
  },
});
