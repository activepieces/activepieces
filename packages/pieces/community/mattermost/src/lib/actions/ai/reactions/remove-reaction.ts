import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const removeReactionAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_remove_reaction',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Remove Reaction',
  description: 'Removes a user\'s emoji reaction from a post.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Removes one emoji reaction a user left on a post; pass "me" for the connected account. Removing someone else\'s reaction needs admin permission. Undo with Add Reaction.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    postId: mattermostAiProps.postId({ required: true }),
    emojiName: Property.ShortText({
      displayName: 'Emoji Name',
      description: 'Emoji name without colons, e.g. "thumbsup". Use List Reactions to see the reactions on a post.',
      required: true,
    }),
  },
  async run(context) {
    const { userId, postId, emojiName } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/users/${encodeURIComponent(userId)}/posts/${encodeURIComponent(postId)}/reactions/${encodeURIComponent(emojiName)}`,
    });
  },
});
