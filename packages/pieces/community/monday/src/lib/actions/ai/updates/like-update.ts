import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { likeUpdateActionOutputSchema } from '../../../output-schemas';

export const likeUpdateAction = createAction({
  auth: mondayAuth,
  name: 'monday_like_update',
  classification: 'WRITE',
  displayName: 'Like Update',
  description: 'Likes an update as the connected user.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Add a like from the connected user to a monday.com update. Use to acknowledge an update without replying; undo with Unlike Update. Liking an already-liked update is a no-op, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: likeUpdateActionOutputSchema,
  props: {
    update_id: mondayAiProps.updateId(true),
  },
  async run(context) {
    const { update_id } = context.propsValue;

    const data = await makeClient(context.auth).query<{ like_update: { id: string; item_id: string | null } }>({
      query: `mutation ($updateId: ID!) {
        like_update(update_id: $updateId) { id item_id }
      }`,
      variables: { updateId: update_id },
    });

    return { id: data.like_update.id, item_id: data.like_update.item_id ?? null, liked: true };
  },
});
