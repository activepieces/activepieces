import { Property, createAction } from '@activepieces/pieces-framework';
import { FileResponseInterface, HumanInputFormResult, HumanInputFormResultTypes } from '@activepieces/shared';
import { StatusCodes } from 'http-status-codes';
import mime from 'mime-types';

export const returnResponse = createAction({
  name: 'return_response',
  displayName: 'Respond on UI',
  description: 'Return a file or text (markdown) as a response.',
  props: {
    markdown: Property.LongText({
      displayName: 'Text (Markdown)',
      required: false,
    }),
    file: Property.File({
      displayName: 'Attachment',
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
    const responseFiles: FileResponseInterface[] = []
    if (propsValue.file) {
      const fileName = propsValue.file.filename;
      const fileBase64 = propsValue.file.base64;
      const mimeType = mime.lookup(fileName);
      responseFiles.push({
        url: await files.write({
          fileName,
          data: Buffer.from(fileBase64, 'base64'),
        }),
        mimeType: mimeType || '',
      });
    }
    const markdownResponseBody: HumanInputFormResult = {
      type: HumanInputFormResultTypes.MARKDOWN,
      value: propsValue.markdown ?? '',
      files: responseFiles,
    }
    run.stop({
      response: {
        status: StatusCodes.OK,
        body: markdownResponseBody,
        headers: {},
      },
    });
    return markdownResponseBody;
  },
});
