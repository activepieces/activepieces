import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { unlikeUpdateActionOutputSchema } from '../../../output-schemas';

export const unlikeUpdateAction = createAction({
  auth: mondayAuth,
  name: 'monday_unlike_update',
  classification: 'WRITE',
  displayName: 'Unlike Update',
  description: 'Removes the connected user\'s like from an update.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Remove the connected user\'s like from a monday.com update, reversing Like Update. Unliking an update that is not liked leaves it unchanged, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: unlikeUpdateActionOutputSchema,
  props: {
    update_id: mondayAiProps.updateId(true),
  },
  async run(context) {
    const { update_id } = context.propsValue;

    const data = await makeClient(context.auth).query<{ unlike_update: { id: string; item_id: string | null } }>({
      query: `mutation ($updateId: ID!) {
        unlike_update(update_id: $updateId) { id item_id }
      }`,
      variables: { updateId: update_id },
    });

    return { id: data.unlike_update.id, item_id: data.unlike_update.item_id ?? null, liked: false };
  },
});
