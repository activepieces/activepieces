/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { discourseAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';

export const createTopic = createAction({
  auth: discourseAuth,
  name: 'create_topic',
  description: 'Create a new topic in Discourse',
  displayName: 'Create Topic',
  props: {
    title: Property.ShortText({
      description: 'Title of the Topic',
      displayName: 'Post Title',
      required: true,
    }),
    raw: Property.LongText({
      description: 'Content of the topic',
      displayName: 'Topic Content',
      required: true,
    }),
    category: Property.Dropdown({
      description: 'ID of the category to post in',
      displayName: 'Category ID',
      required: false,
      options: async ({ auth }: any) => {
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${auth.website_url.trim()}/categories.json`,
          headers: {
            'Api-Key': auth.api_key,
            'Api-Username': auth.api_username,
          },
        });
        const options = response.body['category_list']['categories'].map(
          (res: { name: any; id: any }) => {
            return {
              label: res.name,
              value: res.id,
            };
          }
        );

        return {
          options: options,
          disabled: false,
        };
      },
      refreshers: [],
    }),
  },
  async run(context) {
    const { title, raw, category } = context.propsValue;

    console.log('new post action');

    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${context.auth.website_url.trim()}/posts.json`,
      headers: {
        'Api-Key': context.auth.api_key,
        'Api-Username': context.auth.api_username,
      },
      body: {
        title: title,
        raw: raw,
        category: category,
      },
    });
  },
});
