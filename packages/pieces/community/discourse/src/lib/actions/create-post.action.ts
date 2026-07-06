/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { discourseAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';

export const createPost = createAction({
  auth: discourseAuth,
  name: 'create_post',
  description: 'Create a new post in discourse',
  audience: 'both',
  aiMetadata: { description: 'Add a reply post to an existing Discourse topic, identified by its numeric topic ID. Use when an agent needs to append a message to a thread that already exists (to start a new thread instead, use Create Topic). Each call creates a new post, so it is not idempotent.', idempotent: false },
  displayName: 'Create Post',
  props: {
    raw: Property.LongText({
      description: 'Content of the post',
      displayName: 'Post Content',
      required: true,
    }),
    topic_id: Property.Dropdown({
      auth: discourseAuth,
      description: 'ID of the topic to post in',
      displayName: 'Topic ID',
      required: true,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your discourse account',
          };
        }
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${auth.props.website_url.trim()}/latest.json`,
          headers: {
            'Api-Key': auth.props.api_key,
            'Api-Username': auth.props.api_username,
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
      url: `${context.auth.props.website_url.trim()}/posts.json`,
      headers: {
        'Api-Key': context.auth.props.api_key,
        'Api-Username': context.auth.props.api_username,
      },
      body: {
        raw: raw,
        topic_id: topic_id,
      },
    });
  },
});
