import { createAction } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { likeListOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';
import { blueskyMappers } from '../common/mappers';

export const getPostLikes = createAction({
  auth: blueskyAuth,
  name: 'get_post_likes',
  classification: 'SEARCH',
  displayName: 'Get Post Likes',
  description: 'List the accounts that liked a post',
  audience: 'both',
  outputSchema: likeListOutputSchema,
  aiMetadata: {
    description:
      'Lists the accounts that liked a Bluesky post, given its bsky.app link or AT-URI, newest first with cursor pagination. Use Get Post Reposts or Get Post Quotes for other engagement. Read-only and idempotent.',
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
      action: 'get the post likes',
      fn: async (agent) => {
        const ref = await blueskyRefs.resolvePostRef({ agent, input: propsValue.post });
        const response = await agent.getLikes({ uri: ref.uri, limit, cursor });
        return blueskyMappers.pageOf({
          items: response.data.likes.map((like) => ({
            ...blueskyMappers.profileItem(like.actor),
            likedAt: like.createdAt,
            likeIndexedAt: like.indexedAt,
          })),
          cursor: response.data.cursor,
        });
      },
    });
  },
});
