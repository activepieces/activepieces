import { Property, createAction } from '@activepieces/pieces-framework';

export const getFileName = createAction({
  audience: 'both',
  name: 'get_file_name',
  displayName: 'Get File Name',
  description: 'Get the name of a file',
  aiMetadata: { description: 'Returns only the file name of an input file, without reading or decoding its contents. Use it when the name itself is what you need - to build a path, log it, or branch on the extension - and prefer Read File to get the content or Check File Type to resolve the MIME type. Requires a file input; read-only and idempotent.', idempotent: true },
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
