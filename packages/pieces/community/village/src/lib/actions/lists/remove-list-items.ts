import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

const MAX_ITEM_IDS = 100;

export const removeListItems = createAction({
  auth: villageAuth,
  name: 'remove_list_items',
  displayName: 'Remove items from list',
  description:
    'Remove items from a list by their item IDs (obtained from get_list). Returns the count of successfully removed items.',
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

    const ids = (item_ids ?? []) as string[];
    if (ids.length === 0) {
      throw new Error('At least one item ID is required');
    }
    if (ids.length > MAX_ITEM_IDS) {
      throw new Error(`Maximum ${MAX_ITEM_IDS} item IDs per request`);
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${VILLAGE_API_BASE_URL}/v2/lists/${encodeURIComponent(id)}/items`,
      headers: { Authorization: `Bearer ${context.auth}` },
      body: {
        item_ids: ids,
      },
    });
    return response.body;
  },
});
