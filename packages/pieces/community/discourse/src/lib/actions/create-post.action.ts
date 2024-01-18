/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { discourseAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';

export const createPost = createAction({
  auth: discourseAuth,
  name: 'create_post',
  description: 'Create a new post in discourse',
  displayName: 'Create Post',
  props: {
    raw: Property.LongText({
      description: 'Content of the post',
      displayName: 'Post Content',
      required: true,
    }),
    topic_id: Property.Dropdown({
      description: 'ID of the topic to post in',
      displayName: 'Topic ID',
      required: true,
      options: async ({ auth }: any) => {
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${auth.website_url.trim()}/latest.json`,
          headers: {
            'Api-Key': auth.api_key,
            'Api-Username': auth.api_username,
          },
        });
        const options = response.body['topic_list']['topics'].map(
          (res: { title: any; id: any }) => {
            return {
              label: res.title,
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
    const { raw, topic_id } = context.propsValue;

    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${context.auth.website_url.trim()}/posts.json`,
      headers: {
        'Api-Key': context.auth.api_key,
        'Api-Username': context.auth.api_username,
      },
      body: {
        raw: raw,
        topic_id: topic_id,
      },
    });
  },
});
