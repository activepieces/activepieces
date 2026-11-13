import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetItemRevisionDifferenceOutputSchema } from '../../../output-schemas';

export const getItemRevisionDifferenceAction = createAction({
  auth: podioAuth,
  name: 'podio_get_item_revision_difference',
  outputSchema: podioGetItemRevisionDifferenceOutputSchema,
  displayName: 'Get Item Revision Difference',
  description: 'Lists the field values that changed between two revisions of an item.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Lists each field whose values differ between two revisions of an item, with its values at both revisions. Revision numbers come from Get Item Revisions; the item id from Filter Items or Get Item.',
    idempotent: true,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item, from Filter Items, Get Item or Create Item.' }),
    revisionFrom: podioAiProps.id({ required: true, displayName: 'From Revision', description: 'The earlier revision number, from Get Item Revisions.' }),
    revisionTo: podioAiProps.id({ required: true, displayName: 'To Revision', description: 'The later revision number, from Get Item Revisions.' }),
  },
  async run({ auth, propsValue }) {
    const changes = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/item/${propsValue.itemId}/revision/${propsValue.revisionFrom}/${propsValue.revisionTo}`,
    });
    return { changes, count: changes.length };
  },
});
