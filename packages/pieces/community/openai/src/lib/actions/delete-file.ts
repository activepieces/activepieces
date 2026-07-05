import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';

export const deleteFile = createAction({
  audience: 'human',
  auth: openaiAuth,
  name: 'delete_file',
  displayName: 'Delete File',
  description: 'Delete a file previously uploaded to the connected OpenAI account.',
  props: {
    fileId: Property.ShortText({
      displayName: 'File ID',
      description: 'The OpenAI file ID returned by Upload File (starts with `file-`).',
      required: true,
    }),
  },
  async run(context) {
    const openai = new OpenAI({ apiKey: context.auth.secret_text });
    const { fileId } = context.propsValue;

    const response = await openai.files.del(fileId);

    return response;
  },
});
