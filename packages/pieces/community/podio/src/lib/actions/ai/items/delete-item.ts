import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const deleteItemAction = createAction({
  auth: podioAuth,
  name: 'podio_delete_item',
  displayName: 'Delete Item',
  description: 'Permanently deletes an item.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes one item and removes it from all views; it cannot be restored. Use Bulk Delete Items for many items of one app. The item id comes from Filter Items or Get Item.',
    idempotent: false,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item to delete, from Filter Items or Get Item.' }),
    hook: podioAiProps.hook({ required: false }),
    silent: podioAiProps.silent({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/item/${propsValue.itemId}`,
      query: podioUtils.query({ values: { hook: propsValue.hook, silent: propsValue.silent } }),
    });
  },
});
