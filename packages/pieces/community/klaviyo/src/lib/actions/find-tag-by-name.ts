import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../..';

export const findTagByName = createAction({
  name: 'find_tag_by_name',
  auth: klaviyoAuth,
  displayName: 'Find Tag by Name',
  description: 'Search for a tag by its name in Klaviyo.',
  props: {
    name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The name of the tag to search for',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://a.klaviyo.com/api/tags',
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

    const tags = response.body.data || [];
    
    if (tags.length === 0) {
      return {
        success: true,
        found: false,
        message: `No tag found with name "${context.propsValue.name}"`,
      };
    }

    return {
      success: true,
      found: true,
      count: tags.length,
      tags: tags.map((tag: any) => ({
        id: tag.id,
        name: tag.attributes.name,
        description: tag.attributes.description,
        color: tag.attributes.color,
      })),
      primary_match: {
        id: tags[0].id,
        name: tags[0].attributes.name,
        description: tags[0].attributes.description,
        color: tags[0].attributes.color,
      },
    };
  },
});
