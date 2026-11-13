import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetCommentRevisionsOutputSchema } from '../../../output-schemas';

export const getCommentRevisionsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_comment_revisions',
  outputSchema: podioGetCommentRevisionsOutputSchema,
  displayName: 'Get Comment Revisions',
  description: 'Lists every revision of a comment, oldest first.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Lists all revisions of one Podio comment, oldest first and including the current one, to see how it was edited. The comment id comes from List Comments or Create Comment.',
    idempotent: true,
  },
  props: {
    commentId: podioAiProps.id({ required: true, displayName: 'Comment ID', description: 'The id of the comment.' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/comment/${propsValue.commentId}/revision` });
    return { revisions: body, count: body.length };
  },
});
