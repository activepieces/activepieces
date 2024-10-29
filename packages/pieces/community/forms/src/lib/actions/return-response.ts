import { Property, createAction } from '@activepieces/pieces-framework';
import { FileResponseInterface } from '@activepieces/shared';
import { StatusCodes } from 'http-status-codes';
import mime from 'mime-types';

export const returnResponse = createAction({
  name: 'return_response',
  displayName: 'Respond on UI (File/Markdown)',
  description: 'Return a file or markdown as a response.',
  props: {
    type: Property.StaticDropdown({
      displayName: 'Response Type',
      required: true,
      defaultValue: 'file',
      options: {
        options: [
          {
            value: 'file',
            label: 'File',
          },
          {
            value: 'markdown',
            label: 'Markdown',
          },
        ],
      },
    }),
    file: Property.File({
      displayName: 'File',
      required: false,
    }),
    markdown: Property.LongText({
      displayName: 'Markdown',
      required: false,
    }),
  },
  errorHandlingOptions: {
    retryOnFailure: {
      hide: true,
    },
    continueOnFailure: {
      hide: true,
    },
  },
  async run({ propsValue, run, files }) {
    const responseType = propsValue.type;

    let response;

    if (responseType === 'file') {
      if (!propsValue.file) {
        throw new Error('File is required');
      }
      const fileName = propsValue.file.filename;
      const fileBase64 = propsValue.file.base64;
      const mimeType = mime.lookup(fileName);
      const value: FileResponseInterface = {
        url: await files.write({
          fileName,
          data: Buffer.from(fileBase64, 'base64'),
        }),
        mimeType: mimeType || '',
      };
      response = {
        status: StatusCodes.OK,
        body: {
          type: 'file',
          value,
        },
        headers: {},
      };
    } else {
      if (!propsValue.markdown) {
        throw new Error('Markdown is required');
      }
      response = {
        status: StatusCodes.OK,
        body: {
          type: 'markdown',
          value: propsValue.markdown,
        },
        headers: {},
      };
    }

    run.stop({
      response: response,
    });
    return response;
  },
});
