import { Property, createAction } from '@activepieces/pieces-framework';
import { FileResponseInterface } from '@activepieces/shared';
import { StatusCodes } from 'http-status-codes';
import mimeTypes from 'mime-types';
export const returnFile = createAction({
  name: 'return_file',
  displayName: 'Respond with a file',
  description: 'Download a file as a response.',
  props: {
    file: Property.File({
      displayName: 'File',
      required: true,
    }),
  },
  async run({ propsValue, run }) {
    const fileName = propsValue.file.filename;
    const fileExtension = propsValue.file.extension;
    const fileBase64 = propsValue.file.base64;

    const mimeType = fileExtension ? mimeTypes.lookup(fileExtension) : 'application/octet-stream';
    const base64Url = `data:${mimeType};base64,${fileBase64}`;

    const value: FileResponseInterface = {
      base64Url,
      fileName,
      extension: fileExtension,
  
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
