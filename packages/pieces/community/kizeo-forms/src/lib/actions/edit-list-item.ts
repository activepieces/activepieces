import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { endpoint, kizeoFormsCommon } from '../common';
import { kizeoFormsAuth } from '../..';

export const editListItem = createAction({
  auth: kizeoFormsAuth,

  name: 'edit_list_item',
  displayName: 'Edit List Item',
  description: 'Edit a specific item in a list',
  props: {
    listId: kizeoFormsCommon.listId,
    itemId: Property.ShortText({
      displayName: 'Item Id',
      description: 'The ID of the item to edit',
      required: true,
    }),
    itemLabel: Property.ShortText({
      displayName: 'Item Label',
      description: 'Label for the new list item',
      required: true,
    }),
    properties: kizeoFormsCommon.listProperties,
  },
  async run(context) {
    const { listId, itemId, itemLabel, properties } = context.propsValue;

    type Body = {
      items: [
        {
          item_id: string;
          label: string;
          properties: Record<string, string | number>;
        }
      ];
    };

    const body: Body = {
      items: [
        {
          item_id: itemId,
          label: itemLabel,
          properties: {},
        },
      ],
    };
    for (let i = 0; i < Object.keys(properties).length; i++) {
      const propertyId = Object.keys(properties)[i];
      const propertyValue = properties[Object.keys(properties)[i]];
      body.items[0].properties[propertyId] = parseFloat(propertyValue)
        ? parseFloat(propertyValue)
        : propertyValue;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: endpoint + `public/v4/lists/${listId}/items?used-with-activepieces=`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: context.auth,
      },
      body: body,
    });

    if (response.status === 200) {
      return response.body;
    }
    return [];
  },
});
