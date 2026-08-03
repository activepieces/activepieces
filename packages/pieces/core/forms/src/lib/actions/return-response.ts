import { Property, createAction } from '@activepieces/pieces-framework';
import { FileResponseInterface, HumanInputFormResult, HumanInputFormResultTypes } from '@activepieces/pieces-framework';
import { StatusCodes } from 'http-status-codes';
import mime from 'mime-types';

export const returnResponse = createAction({
  audience: 'both',
  name: 'return_response',
  displayName: 'Respond on UI',
  description: 'Return a file or text (markdown) as a response.',
  aiMetadata: { description: 'Sends markdown text and/or one file attachment back to the person waiting on the Web Form or Chat UI trigger that started the flow. Pick it as the replying step when that trigger has "Wait for Response" enabled; it produces nothing visible in flows started any other way. Not idempotent: each call emits a response to the waiting caller and stores a new file for any attachment.', idempotent: false },
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
    run.respond({
      response: {
        status: StatusCodes.OK,
        body: markdownResponseBody,
        headers: {},
      },
      
    });
    return markdownResponseBody;
  },
});
