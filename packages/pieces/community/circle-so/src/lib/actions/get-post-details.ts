import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { fetchPosts, fetchSpaces, makeCircleRequest } from '../common';
import { circleAuth } from '../../index';

export const getPostDetailsAction = createAction({
  name: 'get_post_details',
  auth: circleAuth,
  displayName: 'Get Post Details',
  description: 'Retrieve complete post content for replication or analysis.',
  props: {
    postId: Property.Dropdown({
      displayName: 'Post',
      description: 'The post you want to retrieve details for',
      required: true,
      refreshers: ['spaceId'],
      options: async ({ auth, spaceId }) => {
        if (!auth || !spaceId) {
          return {
            disabled: true,
            placeholder: spaceId ? 'Please connect your Circle.so account' : 'Please select a space first',
            options: [],
          };
        }

        const apiKey = auth as string;
        const posts = await fetchPosts(apiKey, spaceId as string);

        return {
          options: posts.map((post: any) => ({
            label: post.name,
            value: post.id.toString(),
          })),
        };
      },
    }),
    spaceId: Property.Dropdown({
      displayName: 'Space',
      description: 'The space containing the post',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your Circle.so account',
            options: [],
          };
        }

        const apiKey = auth as string;
        const spaces = await fetchSpaces(apiKey);

        return {
          options: spaces.map((space: any) => ({
            label: space.name,
            value: space.id.toString(),
          })),
        };
      },
    }),
  },
  async run(context) {
    const { postId } = context.propsValue;

    return await makeCircleRequest(
      context.auth as string,
      HttpMethod.GET,
      `/posts/${postId}`
    );
  },
});
