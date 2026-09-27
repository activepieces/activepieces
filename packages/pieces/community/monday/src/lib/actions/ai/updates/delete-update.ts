import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { deleteUpdateActionOutputSchema } from '../../../output-schemas';

export const deleteUpdateAction = createAction({
  auth: mondayAuth,
  name: 'monday_delete_update',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Update',
  description: 'Permanently deletes an update or reply.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently delete a monday.com update or reply by its ID. Irreversible; prefer Edit Update to correct text. A retry after success fails because the update no longer exists.',
    idempotent: false,
  },
  outputSchema: deleteUpdateActionOutputSchema,
  props: {
    update_id: mondayAiProps.updateId(true),
  },
  async run(context) {
    const { update_id } = context.propsValue;

    const data = await makeClient(context.auth).query<{ delete_update: { id: string } }>({
      query: `mutation ($id: ID!) {
        delete_update(id: $id) { id }
      }`,
      variables: { id: update_id },
    });

    return { id: data.delete_update.id, deleted: true };
  },
});
