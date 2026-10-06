import { createAction } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { profileListOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';
import { blueskyMappers } from '../common/mappers';

export const getPostReposts = createAction({
  auth: blueskyAuth,
  name: 'get_post_reposts',
  classification: 'SEARCH',
  displayName: 'Get Post Reposts',
  description: 'List the accounts that reposted a post',
  audience: 'both',
  outputSchema: profileListOutputSchema,
  aiMetadata: {
    description:
      'Lists the accounts that reposted a Bluesky post, given its bsky.app link or AT-URI, with cursor pagination. Use Get Post Quotes for reposts that added a comment. Read-only and idempotent.',
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
      action: 'get the post reposts',
      fn: async (agent) => {
        const ref = await blueskyRefs.resolvePostRef({ agent, input: propsValue.post });
        const response = await agent.getRepostedBy({ uri: ref.uri, limit, cursor });
        return blueskyMappers.pageOf({ items: response.data.repostedBy.map(blueskyMappers.profileItem), cursor: response.data.cursor });
      },
    });
  },
});
