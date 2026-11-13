import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioFindReferenceableItemsOutputSchema } from '../../../output-schemas';

export const getTopValuesForFieldAction = createAction({
  auth: podioAuth,
  name: 'podio_get_top_values_for_field',
  outputSchema: podioFindReferenceableItemsOutputSchema,
  displayName: 'Get Top Values for Field',
  description: 'Lists the items most likely to be picked for an app-reference field.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the top suggested items for an app-reference field (only "app" fields are supported), with their item ids, titles and apps. Use Find Referenceable Items to search by text. The field id comes from Get App.',
    idempotent: true,
  },
  props: {
    fieldId: podioAiProps.id({ required: true, displayName: 'Field ID', description: 'The id of the app-reference field, from Get App.' }),
    notItemId: podioAiProps.text({ required: false, displayName: 'Exclude Item IDs', description: 'Item ids to leave out of the results, comma-separated, e.g. the item being edited.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of items to return. Defaults to 13.' }),
  },
  async run({ auth, propsValue }) {
    const items = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/item/field/${propsValue.fieldId}/top/`,
      query: podioUtils.query({ values: { not_item_id: propsValue.notItemId, limit: propsValue.limit ?? 13 } }),
    });
    return { items, count: items.length };
  },
});
