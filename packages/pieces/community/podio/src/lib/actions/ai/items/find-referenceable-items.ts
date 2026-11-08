import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioFindReferenceableItemsOutputSchema } from '../../../output-schemas';

export const findReferenceableItemsAction = createAction({
  auth: podioAuth,
  name: 'podio_find_referenceable_items',
  outputSchema: podioFindReferenceableItemsOutputSchema,
  displayName: 'Find Referenceable Items',
  description: 'Searches the items an app-reference field can link to.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Searches the apps an app-reference field points to for items whose title contains the text (case-insensitive), returning item ids to set in that field with Create Item or Update Item. Use Get Top Values for Field for suggestions without text. The field id comes from Get App.',
    idempotent: true,
  },
  props: {
    fieldId: podioAiProps.id({ required: true, displayName: 'Field ID', description: 'The id of the app-reference field, from Get App.' }),
    text: podioAiProps.text({ required: false, displayName: 'Text', description: 'Text to search item titles for; matched anywhere in the title, case-insensitive.' }),
    notItemId: podioAiProps.text({ required: false, displayName: 'Exclude Item IDs', description: 'Item ids to leave out of the results, comma-separated, e.g. the item being edited.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of items to return. Defaults to 13.' }),
  },
  async run({ auth, propsValue }) {
    const items = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/item/field/${propsValue.fieldId}/find`,
      query: podioUtils.query({ values: { text: propsValue.text, not_item_id: propsValue.notItemId, limit: propsValue.limit ?? 13 } }),
    });
    return { items, count: items.length };
  },
});
