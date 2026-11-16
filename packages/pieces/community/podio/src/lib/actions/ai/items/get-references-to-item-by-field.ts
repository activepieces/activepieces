import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetReferencesToItemByFieldOutputSchema } from '../../../output-schemas';

export const getReferencesToItemByFieldAction = createAction({
  auth: podioAuth,
  name: 'podio_get_references_to_item_by_field',
  outputSchema: podioGetReferencesToItemByFieldOutputSchema,
  displayName: 'Get References to Item by Field',
  description: 'Lists the items that reference an item through one app-reference field.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists, one page at a time, the items that link to the given item through one app-reference field, each with its item id, title and link. Use Get Item References for every field at once. The item id comes from Filter Items or Get Item; the field id (a field of the referencing app) from Get App.',
    idempotent: true,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the referenced item, from Filter Items, Get Item or Create Item.' }),
    fieldId: podioAiProps.id({ required: true, displayName: 'Field ID', description: 'The id of the app-reference field in the referencing app, from Get App or Get Item References.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of items to return. Defaults to 10.' }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    const items = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/item/${propsValue.itemId}/reference/field/${propsValue.fieldId}`,
      query: podioUtils.query({ values: { limit: propsValue.limit ?? 10, offset: propsValue.offset } }),
    });
    return { items, count: items.length };
  },
});
