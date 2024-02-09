import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { endpoint, kizeoFormsCommon } from '../common';
import { kizeoFormsAuth } from '../..';

export const CreateListItem = createAction({
  auth: kizeoFormsAuth,

  name: 'create_list_item',
  displayName: 'Create List Item',
  description: 'Create a new list item in Kizeo Forms',
  props: {
    listId: kizeoFormsCommon.listId,
    itemLabel: Property.ShortText({
      displayName: 'Item Label',
      description: 'Label for the new list item',
      required: true,
    }),
    properties: kizeoFormsCommon.listProperties,
  },
  async run(context) {
    const { listId, itemLabel, properties } = context.propsValue;
    type Body = {
      items: [
        {
          label: string;
          properties: Record<string, string | number>;
        }
      ];
    };

    const body: Body = {
      items: [
        {
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

    const response = await httpClient.sendRequest<{ data: unknown }>({
      method: HttpMethod.POST,
      url:
        endpoint + `public/v4/lists/${listId}/items?used-with-active-pieces=`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: context.auth,
      },
      body: body,
    });

    if (response.status === 201) {
      return response.body;
    }
    return [];
  },
});
