import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostGetPostsByIdsOutputSchema } from '../../../output-schemas';

export const getPostsByIdsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_posts_by_ids',
  outputSchema: mattermostGetPostsByIdsOutputSchema,
  displayName: 'Get Posts By IDs',
  description: 'Gets several posts at once by their IDs.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the posts with the given IDs in one call; IDs the connected user cannot read are left out. Use Get Post for a single post.',
    idempotent: true,
  },
  props: {
    postIds: Property.Array({
      displayName: 'Post IDs',
      description: 'Post IDs (26 characters each). Use List Channel Posts or Search Posts to find them.',
      required: true,
    }),
  },
  async run(context) {
    const posts = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/posts/ids',
      body: context.propsValue.postIds,
    });
    return { posts, count: posts.length };
  },
});
