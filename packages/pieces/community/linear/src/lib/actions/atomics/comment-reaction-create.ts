import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { atomicMappers, LinearReactionNode } from './common';
import { REACTION_CREATE_MUTATION } from './queries';
import { atomicReactionOutputSchema } from './output-schemas';

export const linearCommentReactionCreateAtomic = createAction({
  auth: linearAuth,
  name: 'linear_comment_reaction_create',
  classification: 'WRITE',
  displayName: 'React to Comment (AI)',
  description: 'Add an emoji reaction to a comment.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds an emoji reaction from the API key owner to a Linear comment, for example to acknowledge it without writing a reply. Pass the emoji as its name (thumbsup, eyes, white_check_mark) or as the emoji character. Remove it later with Delete Reaction using the returned ID. Not idempotent: a repeat call may add a second reaction or fail.',
    idempotent: false,
  },
  props: {
    comment_id: Property.ShortText({ displayName: 'Comment ID', description: 'UUID of the comment.', required: true }),
    emoji: Property.ShortText({ displayName: 'Emoji', description: 'Emoji name such as thumbsup or eyes, or the emoji itself.', required: true }),
  },
  outputSchema: atomicReactionOutputSchema,
  async run({ auth, propsValue }) {
    const emoji = propsValue.emoji.trim().replace(/^:(.+):$/, '$1');
    if (emoji.length === 0) {
      throw new Error('Emoji is required.');
    }
    const data = await linearGraphql.request<{
      reactionCreate: { success: boolean; reaction: LinearReactionNode };
    }>({
      auth,
      query: REACTION_CREATE_MUTATION,
      variables: { input: { commentId: propsValue.comment_id.trim(), emoji } },
    });
    const payload = linearGraphql.requireSuccess({ payload: data.reactionCreate, what: 'reaction' });
    return atomicMappers.flattenReaction(payload.reaction);
  },
});
