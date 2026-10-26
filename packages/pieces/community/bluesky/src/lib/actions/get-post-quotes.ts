import { createAction } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { postListOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';
import { blueskyMappers } from '../common/mappers';

export const getPostQuotes = createAction({
  auth: blueskyAuth,
  name: 'get_post_quotes',
  classification: 'SEARCH',
  displayName: 'Get Post Quotes',
  description: 'List the posts that quote a post',
  audience: 'both',
  outputSchema: postListOutputSchema,
  aiMetadata: {
    description:
      'Lists the posts that quote (repost with a comment) a Bluesky post, given its bsky.app link or AT-URI, with cursor pagination. Use Get Post Reposts for plain reposts. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    post: blueskyProps.postInputProperty(),
    limit: blueskyProps.limitProperty(),
    cursor: blueskyProps.cursorProperty(),
  },
  async run({ auth, propsValue }) {
    blueskyRefs.parsePostInput(propsValue.post);
    const limit = blueskyProps.parseLimit(propsValue.limit);
    const cursor = blueskyProps.parseCursor(propsValue.cursor);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'get the post quotes',
      fn: async (agent) => {
        const ref = await blueskyRefs.resolvePostRef({ agent, input: propsValue.post });
        const response = await agent.app.bsky.feed.getQuotes({ uri: ref.uri, limit, cursor });
        return blueskyMappers.pageOf({
          items: response.data.posts.map((post) => ({ ...blueskyMappers.postBase(post), text: blueskyMappers.recordText(post.record) })),
          cursor: response.data.cursor,
        });
      },
    });
  },
});
