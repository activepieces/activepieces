import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { REACTION_DELETE_MUTATION } from './queries';

export const linearReactionDeleteAtomic = createAction({
  auth: linearAuth,
  name: 'linear_reaction_delete',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Reaction (AI)',
  description: 'Remove an emoji reaction by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes one emoji reaction from a Linear comment, identified by the reaction ID returned by React to Comment. Only the reaction is removed, never the comment. Not idempotent: a second call fails because the reaction is already gone.',
    idempotent: false,
  },
  props: {
    reaction_id: Property.ShortText({ displayName: 'Reaction ID', description: 'UUID of the reaction (from React to Comment).', required: true }),
  },
  async run({ auth, propsValue }) {
    const data = await linearGraphql.request<{
      reactionDelete: { success: boolean; entityId: string };
    }>({ auth, query: REACTION_DELETE_MUTATION, variables: { id: propsValue.reaction_id.trim() } });
    const payload = linearGraphql.requireSuccess({ payload: data.reactionDelete, what: 'reaction removal' });
    return { success: true, deleted_id: payload.entityId };
  },
});
