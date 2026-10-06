import { createAction, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { getPostsOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyRefs } from '../common/refs';
import { blueskyMappers } from '../common/mappers';
import { blueskyCompose } from '../common/compose';

const MAX_POSTS = 25;

export const blueskyGetPosts = createAction({
  auth: blueskyAuth,
  name: 'bluesky_get_posts',
  classification: 'READ',
  displayName: 'Get Posts (AI)',
  description: 'Fetch up to 25 posts by link or AT-URI in one call',
  audience: 'ai',
  outputSchema: getPostsOutputSchema,
  aiMetadata: {
    description:
      'Fetches up to 25 Bluesky posts in one call, given their bsky.app links or AT-URIs, with text, author and engagement counts; inputs that are deleted or hidden are listed in notFound. Use Find Thread for replies around a post. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    posts: Property.Array({ displayName: 'Posts', description: 'Up to 25 post links or at:// URIs.', required: true }),
  },
  async run({ auth, propsValue }) {
    const inputs = blueskyCompose.stringList(propsValue.posts);
    if (inputs.length === 0 || inputs.length > MAX_POSTS) {
      throw new Error(`Give between 1 and ${MAX_POSTS} posts; got ${inputs.length}.`);
    }
    inputs.forEach((input) => blueskyRefs.parsePostInput(input));
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'get the posts',
      fn: async (agent) => {
        const refs: { input: string; uri: string }[] = [];
        for (const input of inputs) {
          refs.push({ input, uri: (await blueskyRefs.resolvePostRef({ agent, input })).uri });
        }
        const response = await agent.getPosts({ uris: [...new Set(refs.map((ref) => ref.uri))] });
        const found = new Set(response.data.posts.map((post) => post.uri));
        return {
          posts: response.data.posts.map((post) => ({ ...blueskyMappers.postBase(post), text: blueskyMappers.recordText(post.record) })),
          notFound: refs.filter((ref) => !found.has(ref.uri)).map((ref) => ref.input),
        };
      },
    });
  },
});
