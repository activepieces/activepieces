import { Property, createAction } from '@activepieces/pieces-framework';

export const getFileName = createAction({
  name: 'get_file_name',
  displayName: 'Get File Name',
  description: 'Get the name of a file',
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
  },
  async run(context) {
    const file = context.propsValue.file;
    return {
      fileName: file.filename,
    };
  },
});
