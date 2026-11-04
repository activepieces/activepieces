import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostApi } from '../../../common/api';
import { mattermostClient } from '../../../common/client';
import { mattermostAddReactionOutputSchema } from '../../../output-schemas';

export const addReactionAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_add_reaction',
  outputSchema: mattermostAddReactionOutputSchema,
  displayName: 'Add Reaction',
  description: 'Adds an emoji reaction to a post as the connected user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds an emoji reaction to a post as the connected user. Repeating the same emoji on the same post keeps a single reaction.',
    idempotent: true,
  },
  props: {
    postId: mattermostAiProps.postId({ required: true }),
    emojiName: Property.ShortText({
      displayName: 'Emoji Name',
      description: 'Emoji name without colons, e.g. "thumbsup" or a custom emoji name.',
      required: true,
    }),
  },
  async run(context) {
    const { postId, emojiName } = context.propsValue;
    const me = await mattermostApi.getMe({ auth: context.auth });
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/reactions',
      body: { user_id: me.id, post_id: postId, emoji_name: emojiName },
    });
  },
});
