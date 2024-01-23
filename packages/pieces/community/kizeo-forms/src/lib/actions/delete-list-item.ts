import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { endpoint, kizeoFormsCommon } from '../common';
import { kizeoFormsAuth } from '../..';

export const deleteListItem = createAction({
  auth: kizeoFormsAuth,

  name: 'delete_list_item',
  displayName: 'Delete List Item',
  description: 'Delete a specific item from a list',
  props: {
    listId: kizeoFormsCommon.listId,
    itemId: Property.ShortText({
      displayName: 'Item Id',
      description: 'The ID of the item to delete',
      required: true,
    }),
  },
  async run(context) {
    const { listId, itemId } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url:
        endpoint +
        `public/v4/lists/${listId}/items/${itemId}?used-with-active-pieces=`,
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
