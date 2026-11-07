import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetItemRevisionsOutputSchema } from '../../../output-schemas';

export const getItemRevisionsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_item_revisions',
  outputSchema: podioGetItemRevisionsOutputSchema,
  displayName: 'Get Item Revisions',
  description: 'Lists the last 30 revisions of an item.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the revisions of an item (Podio keeps at most the last 30): each with its number, who made it, when and through which client. Feed the numbers to Get Item Revision Difference, Undo Item Revision or Revert Item to Revision. The item id comes from Filter Items or Get Item.',
    idempotent: true,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item, from Filter Items, Get Item or Create Item.' }),
  },
  async run({ auth, propsValue }) {
    const revisions = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/item/${propsValue.itemId}/revision/` });
    return { revisions, count: revisions.length };
  },
});
