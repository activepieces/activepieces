import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const deleteItemReferenceAction = createAction({
  auth: podioAuth,
  name: 'podio_delete_item_reference',
  displayName: 'Delete Item Reference',
  description: 'Removes the reference an item was created with, if any.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes the item\'s own reference (the "ref" set with Create Item\'s Reference Item ID), leaving the item and its field values in place. It does not touch app-reference field values; change those with Update Item. The item id comes from Filter Items or Get Item.',
    idempotent: false,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item, from Filter Items or Get Item.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/item/${propsValue.itemId}/ref` });
  },
});
