import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostPatchPostOutputSchema } from '../../../output-schemas';

export const patchPostAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_patch_post',
  outputSchema: mattermostPatchPostOutputSchema,
  displayName: 'Update Post',
  description: 'Edits a post, changing only the fields you set.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Edits a post\'s message, pinned state or attached files; fields left empty stay as they are. File IDs replace the attachment list. Set at least one field.',
    idempotent: true,
  },
  props: {
    postId: mattermostAiProps.postId({ required: true }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'New message text; Markdown is supported.',
      required: false,
    }),
    isPinned: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Is Pinned',
      description: '"true" to pin the post to its channel, "false" to unpin it.',
    }),
    fileIds: Property.Array({
      displayName: 'File IDs',
      description: 'Replaces the attached files with these file IDs from Upload File.',
      required: false,
    }),
  },
  async run(context) {
    const { postId, message, isPinned, fileIds } = context.propsValue;
    const pinned = mattermostUtils.parseBoolean({ value: isPinned });
    const body = {
      ...(message !== undefined ? { message } : {}),
      ...(pinned !== undefined ? { is_pinned: pinned } : {}),
      ...(fileIds && fileIds.length > 0 ? { file_ids: fileIds } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one of Message, Is Pinned or File IDs.');
    }
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/posts/${encodeURIComponent(postId)}/patch`,
      body,
    });
  },
});
