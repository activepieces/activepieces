import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioApi } from '../../../common/api';
import { podioGetCommentOutputSchema } from '../../../output-schemas';

export const getCommentAction = createAction({
  auth: podioAuth,
  name: 'podio_get_comment',
  outputSchema: podioGetCommentOutputSchema,
  displayName: 'Get Comment',
  description: 'Gets one comment by its id.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Podio comment with its text, author, files, embed and the object it is on. The comment id comes from List Comments or Create Comment.',
    idempotent: true,
  },
  props: {
    commentId: podioAiProps.id({ required: true, displayName: 'Comment ID', description: 'The id of the comment.' }),
  },
  async run({ auth, propsValue }) {
    return await podioApi.getComment({ auth, commentId: propsValue.commentId });
  },
});
