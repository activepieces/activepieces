import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetItemReferencesOutputSchema } from '../../../output-schemas';

export const getItemReferencesAction = createAction({
  auth: podioAuth,
  name: 'podio_get_item_references',
  outputSchema: podioGetItemReferencesOutputSchema,
  displayName: 'Get Item References',
  description: 'Lists the items that reference an item, grouped by app and field.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the items that link to the given item through an app-reference field, grouped by app and field and sorted by title. Use Get References to Item by Field to page through one field. The item id comes from Filter Items or Get Item.',
    idempotent: true,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the referenced item, from Filter Items, Get Item or Create Item.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of referencing items to return. Defaults to 100, at most 1000.' }),
  },
  async run({ auth, propsValue }) {
    const references = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/item/${propsValue.itemId}/reference/`,
      query: podioUtils.query({ values: { limit: Math.min(propsValue.limit ?? 100, 1000) } }),
    });
    return { references, count: references.length };
  },
});
