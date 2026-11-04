import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUploadFileOutputSchema } from '../../../output-schemas';

export const uploadFileAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_upload_file',
  outputSchema: mattermostUploadFileOutputSchema,
  displayName: 'Upload File',
  description: 'Uploads a file to a channel so it can be attached to a post.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Uploads a file into a channel and returns its file ID; the file stays hidden until a post attaches it, so pass the ID to Create Post (File IDs) or Create Bookmark. Not idempotent: each call stores a new file.',
    idempotent: false,
  },
  props: {
    channelId: mattermostAiProps.channelId({ required: true }),
    file: Property.File({
      displayName: 'File',
      description: 'File to upload.',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Name to store the file under, with extension. Defaults to the file\'s own name.',
      required: false,
    }),
  },
  async run(context) {
    const { channelId, file, fileName } = context.propsValue;
    const form = new FormData();
    form.append('channel_id', channelId);
    form.append('files', new Blob([new Uint8Array(file.data)]), fileName ?? file.filename);
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/files',
      body: form,
    });
  },
});
