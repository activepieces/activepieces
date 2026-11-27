import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxCreateCommentOutputSchema } from '../../../output-schemas';

export const updateCommentAction = createAction({
  auth: boxAuth,
  name: 'box_update_comment',
  outputSchema: boxCreateCommentOutputSchema,
  displayName: 'Update Comment',
  description: 'Changes the text of a Box comment.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces the message of a comment; only its author can edit it. Get the ID from List File Comments or Create Comment.',
    idempotent: true,
  },
  props: {
    commentId: boxAiProps.commentId({ required: true }),
    message: Property.LongText({ displayName: 'Message', description: 'The new comment text.', required: true }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/comments/${encodeURIComponent(propsValue.commentId)}`,
      query: { fields: propsValue.fields },
      body: { message: propsValue.message },
    });
  },
});
