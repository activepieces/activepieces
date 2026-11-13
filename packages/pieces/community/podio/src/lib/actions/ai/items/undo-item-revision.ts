import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioDeleteAppFieldOutputSchema } from '../../../output-schemas';

export const undoItemRevisionAction = createAction({
  auth: podioAuth,
  name: 'podio_undo_item_revision',
  outputSchema: podioDeleteAppFieldOutputSchema,
  displayName: 'Undo Item Revision',
  description: 'Undoes the changes made in one revision of an item.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Undoes only the changes made in one revision, restoring the values from just before it and overwriting later changes to the same fields; Podio records this as a new revision. Use Revert Item to Revision to undo everything after a revision. The revision number comes from Get Item Revisions.',
    idempotent: false,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item, from Filter Items or Get Item.' }),
    revision: podioAiProps.id({ required: true, displayName: 'Revision', description: 'The number of the revision to undo, from Get Item Revisions.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/item/${propsValue.itemId}/revision/${propsValue.revision}` });
  },
});
