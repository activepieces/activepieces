import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const deleteCommentAction = createAction({
  auth: podioAuth,
  name: 'podio_delete_comment',
  displayName: 'Delete Comment',
  description: 'Permanently deletes a comment.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes one Podio comment; it cannot be restored. The comment id comes from List Comments or Create Comment.',
    idempotent: false,
  },
  props: {
    commentId: podioAiProps.id({ required: true, displayName: 'Comment ID', description: 'The id of the comment to delete.' }),
    hook: podioAiProps.hook({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/comment/${propsValue.commentId}`,
      query: podioUtils.query({ values: { hook: podioUtils.toBool({ value: propsValue.hook }) } }),
    });
  },
});
