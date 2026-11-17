import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

const MAX_ITEM_IDS = 100;

export const removeListItems = createAction({
  auth: villageAuth,
  name: 'remove_list_items',
  classification: 'WRITE',
  displayName: 'Remove items from list',
  description:
    'Remove items from a list by their item IDs (obtained from get_list). Returns the count of successfully removed items.',
  audience: 'both',
  aiMetadata: {
    description:
      'Remove up to 100 items from a list by their list-item IDs, which you must first obtain from Get a list (these are not entity/person IDs). Effectively idempotent: removing an item already gone is a no-op rather than an error.',
    idempotent: true,
  },
  outputSchema: villageSchemas.removeListItems,
  props: {
    id: Property.ShortText({
      displayName: 'List ID',
      description: 'List ID',
      required: true,
    }),
    item_ids: Property.Array({
      displayName: 'Item IDs',
      description: 'Array of item IDs to remove from the list (max 100)',
      required: true,
    }),
  },
  async run(context) {
    const { id, item_ids } = context.propsValue;

    const ids = villageApi.stringList(item_ids);
    if (ids.length === 0) {
      throw new Error('At least one item ID is required');
    }
    if (ids.length > MAX_ITEM_IDS) {
      throw new Error(`Maximum ${MAX_ITEM_IDS} item IDs per request`);
    }

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/v2/lists/${encodeURIComponent(id)}/items`,
      body: {
        item_ids: ids,
      },
    });
    return response;
  },
});
