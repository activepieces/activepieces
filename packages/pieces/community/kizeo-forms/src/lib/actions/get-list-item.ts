import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { endpoint, kizeoFormsCommon } from '../common';
import { kizeoFormsAuth } from '../..';

export const getListItem = createAction({
  auth: kizeoFormsAuth,

  name: 'get_list_item',
  displayName: 'Get List Item',
  description: 'Get a specific item from a list',
  props: {
    listId: kizeoFormsCommon.listId,
    itemId: Property.ShortText({
      displayName: 'Item Id',
      description: 'The ID of the item you want to retrieve from the list',
      required: true,
    }),
  },
  async run(context) {
    const { listId, itemId } = context.propsValue;
    const response = await httpClient.sendRequest<{ data: unknown }>({
      method: HttpMethod.GET,
      url:
        endpoint +
        `public/v4/lists/${listId}/items/${itemId}?used-with-activepieces=`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: context.auth,
      },
    });
    if (response.status === 200) {
      return response.body;
    }
    return [];
  },
});
