import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postizAuth } from '../common/auth';
import { postizApiCall } from '../common';

export const listPosts = createAction({
  auth: postizAuth,
  name: 'list_posts',
  displayName: 'List Posts',
  description: 'Retrieve posts within a date range',
  props: {
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Start of the date range (ISO 8601 format)',
      required: true,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'End of the date range (ISO 8601 format)',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth;

    const response = await postizApiCall<{
      posts: {
        id: string;
        content: string;
        publishDate: string;
        releaseURL: string;
        state: string;
        integration: {
          id: string;
          providerIdentifier: string;
          name: string;
          picture: string;
        };
      }[];
    }>({
      auth,
      method: HttpMethod.GET,
      path: '/posts',
      queryParams: {
        startDate: context.propsValue.startDate,
        endDate: context.propsValue.endDate,
      },
    });

    return response.body.posts.map((post) => ({
      id: post.id,
      content: post.content,
      publish_date: post.publishDate,
      release_url: post.releaseURL ?? null,
      state: post.state,
      integration_id: post.integration?.id ?? null,
      integration_provider: post.integration?.providerIdentifier ?? null,
      integration_name: post.integration?.name ?? null,
    }));
  },
});
