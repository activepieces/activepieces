import { Property, createAction } from '@activepieces/pieces-framework';
import { FileResponseInterface } from '@activepieces/shared';
import { StatusCodes } from 'http-status-codes';
import mime from 'mime-types';

export const returnFile = createAction({
  name: 'return_file',
  displayName: 'Respond on UI (File)',
  description: 'Return a file as a response.',
  props: {
    file: Property.File({
      displayName: 'File',
      required: true,
    }),
  },
  errorHandlingOptions: {
    retryOnFailure: {
      hide: true,
    },
    continueOnFailure: {
      hide: true,
    }
  },
  async run({ propsValue, run, files }) {
    const fileName = propsValue.file.filename;
    const fileBase64 = propsValue.file.base64;
    const mimeType = mime.lookup(fileName);
    const value: FileResponseInterface = {
      url: await files.write({
        fileName,
        data: Buffer.from(fileBase64, 'base64'),  
      }),
      mimeType: mimeType || '',
    }
    const response = {
      status: StatusCodes.OK,
      body: {
        type: 'file',
        value,
      },
      headers: {},
    };

    run.stop({
      response: response,
    });
    return response;
  },
});
