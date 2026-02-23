import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../..';

export const findListByName = createAction({
  name: 'find_list_by_name',
  auth: klaviyoAuth,
  displayName: 'Find List by Name',
  description: 'Search for a list by its name in Klaviyo.',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'The name of the list to search for',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://a.klaviyo.com/api/lists',
      headers: {
        'Accept': 'application/json',
        'Revision': '2024-10-15',
        'Authorization': `Klaviyo-API-Key ${context.auth.secret_text}`,
      },
      queryParams: {
        filter: `equals(name,"${context.propsValue.name}")`,
        'page[size]': '100',
      },
    });

    const lists = response.body.data || [];
    
    if (lists.length === 0) {
      return {
        success: true,
        found: false,
        message: `No list found with name "${context.propsValue.name}"`,
      };
    }

    return {
      success: true,
      found: true,
      count: lists.length,
      lists: lists.map((list: any) => ({
        id: list.id,
        name: list.attributes.name,
        created: list.attributes.created,
        updated: list.attributes.updated,
      })),
      primary_match: {
        id: lists[0].id,
        name: lists[0].attributes.name,
        created: lists[0].attributes.created,
        updated: lists[0].attributes.updated,
      },
    };
  },
});
