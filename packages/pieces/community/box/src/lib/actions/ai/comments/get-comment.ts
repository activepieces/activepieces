import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxCreateCommentOutputSchema } from '../../../output-schemas';

export const getCommentAction = createAction({
  auth: boxAuth,
  name: 'box_get_comment',
  outputSchema: boxCreateCommentOutputSchema,
  displayName: 'Get Comment',
  description: 'Gets a comment on a Box file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one comment by ID: its message, author, file and whether it is a reply. Get the ID from List File Comments or Create Comment.',
    idempotent: true,
  },
  props: {
    commentId: boxAiProps.commentId({ required: true }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/comments/${encodeURIComponent(propsValue.commentId)}`,
      query: { fields: propsValue.fields },
    });
  },
});
