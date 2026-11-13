import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioDeleteAppFieldOutputSchema } from '../../../output-schemas';

export const revertItemToRevisionAction = createAction({
  auth: podioAuth,
  name: 'podio_revert_item_to_revision',
  outputSchema: podioDeleteAppFieldOutputSchema,
  displayName: 'Revert Item to Revision',
  description: 'Restores an item to its values at a revision, undoing every later change.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Restores all of an item\'s values to how they were at the given revision, undoing every change made after it; Podio records this as a new revision. Use Undo Item Revision to undo a single revision. The revision number comes from Get Item Revisions.',
    idempotent: false,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item, from Filter Items or Get Item.' }),
    revision: podioAiProps.id({ required: true, displayName: 'Revision', description: 'The number of the revision to go back to, from Get Item Revisions.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/item/${propsValue.itemId}/revision/${propsValue.revision}/revert_to` });
  },
});
