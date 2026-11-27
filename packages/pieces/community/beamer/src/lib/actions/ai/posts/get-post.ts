import { createAction } from '@activepieces/pieces-framework';
import { beamerAuth } from '../../../auth';
import { beamerAiProps } from '../../../common/ai-props';
import { beamerApi } from '../../../common/api';
import { beamerGetPostOutputSchema } from '../../../output-schemas';

export const getPostAction = createAction({
  auth: beamerAuth,
  name: 'beamer_get_post',
  outputSchema: beamerGetPostOutputSchema,
  displayName: 'Get Post',
  description: 'Gets one Beamer post by its ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one Beamer post by ID, drafts included, with its translations (title, content, URL), category, publish state and view, click and reaction counts. Get the ID from List Posts or Create Post.',
    idempotent: true,
  },
  props: {
    postId: beamerAiProps.postId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await beamerApi.getPost({ auth, postId: propsValue.postId });
  },
});
