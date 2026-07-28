import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';

export const deleteFile = createAction({
  audience: 'both',
  auth: openaiAuth,
  name: 'delete_file',
  displayName: 'Delete File',
  description: 'Delete a file previously uploaded to the connected OpenAI account.',
  aiMetadata: { description: 'Permanently removes one file from the connected OpenAI account, identified by the OpenAI file id returned by upload_file (it starts with file-). Use it to clean up assistant, vision, batch, or fine-tune uploads that are no longer needed; find_file resolves a filename to that id first. Deleting converges on the same end state so it counts as idempotent, but a repeat call for an id that is already gone fails with a not-found error.', idempotent: true },
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
