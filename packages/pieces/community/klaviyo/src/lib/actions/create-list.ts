import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../..';

export const createList = createAction({
  name: 'create_list',
  auth: klaviyoAuth,
  displayName: 'Create List',
  description: 'Create a new list in Klaviyo.',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'The name of the list to create',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://a.klaviyo.com/api/lists',
      headers: {
        'Accept': 'application/json',
        'Revision': '2024-10-15',
        'Authorization': `Klaviyo-API-Key ${context.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body: {
        data: {
          type: 'list',
          attributes: {
            name: context.propsValue.name,
          },
        },
      },
    });

    return {
      success: true,
      data: response.body.data,
    };
  },
});
