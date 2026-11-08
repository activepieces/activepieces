import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetItemCloneOutputSchema } from '../../../output-schemas';

export const getItemCloneAction = createAction({
  auth: podioAuth,
  name: 'podio_get_item_clone',
  outputSchema: podioGetItemCloneOutputSchema,
  displayName: 'Get Item Clone',
  description: 'Gets the values a copy of an item would have, without creating it.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the field values a clone of the item would get, without saving anything; pass them to Create Item to make an edited copy, or use Clone Item to copy as-is. The item id comes from Filter Items or Get Item.',
    idempotent: true,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item, from Filter Items, Get Item or Create Item.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/item/${propsValue.itemId}/clone` });
  },
});
