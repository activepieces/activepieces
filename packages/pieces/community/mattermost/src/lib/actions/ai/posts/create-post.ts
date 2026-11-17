import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostCreatePostOutputSchema } from '../../../output-schemas';

export const createPostAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_create_post',
  outputSchema: mattermostCreatePostOutputSchema,
  displayName: 'Create Post',
  description: 'Posts a message to a channel or replies in a thread.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Posts a message to a channel, or replies in a thread when Root ID is set. Attach files by passing File IDs from Upload File. Not idempotent: each call creates a separate post.',
    idempotent: false,
  },
  props: {
    channelId: mattermostAiProps.channelId({ required: true }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Message text; Markdown is supported.',
      required: true,
    }),
    rootId: Property.ShortText({
      displayName: 'Root ID',
      description: 'ID of the thread root post to reply to. Leave empty to start a new post.',
      required: false,
    }),
    fileIds: Property.Array({
      displayName: 'File IDs',
      description: 'Up to 10 file IDs from Upload File, uploaded to the same channel.',
      required: false,
    }),
  },
  async run(context) {
    const { channelId, message, rootId, fileIds } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/posts',
      body: {
        channel_id: channelId,
        message,
        root_id: rootId,
        file_ids: fileIds && fileIds.length > 0 ? fileIds : undefined,
      },
    });
  },
});
