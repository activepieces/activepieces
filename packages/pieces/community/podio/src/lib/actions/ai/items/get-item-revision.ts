import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetItemRevisionOutputSchema } from '../../../output-schemas';

export const getItemRevisionAction = createAction({
  auth: podioAuth,
  name: 'podio_get_item_revision',
  outputSchema: podioGetItemRevisionOutputSchema,
  displayName: 'Get Item Revision',
  description: 'Gets who made one revision of an item, when and through which client.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one revision of an item: its number, who made it, when and through which client. Revision numbers come from Get Item Revisions; use Get Item Revision Difference for what changed.',
    idempotent: true,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item, from Filter Items, Get Item or Create Item.' }),
    revision: podioAiProps.id({ required: true, displayName: 'Revision', description: 'The revision number, from Get Item Revisions.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/item/${propsValue.itemId}/revision/${propsValue.revision}` });
  },
});
