import { createAction } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { deletePostOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';

export const deletePost = createAction({
  auth: blueskyAuth,
  name: 'delete_post',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Post',
  description: 'Permanently delete one of your own posts',
  audience: 'both',
  outputSchema: deletePostOutputSchema,
  aiMetadata: {
    description:
      'Permanently deletes a post owned by the connected Bluesky account, given its bsky.app link or AT-URI; it refuses posts by other accounts. The deletion cannot be undone. Idempotent: deleting an already-deleted post succeeds and reports existed=false.',
    idempotent: true,
  },
  props: {
    post: blueskyProps.postInputProperty(),
  },
  async run({ auth, propsValue }) {
    blueskyRefs.parsePostInput(propsValue.post);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'delete the post',
      fn: async (agent) => {
        const ref = await blueskyRefs.resolvePostRef({ agent, input: propsValue.post });
        const me = blueskyClient.sessionDid(agent);
        if (ref.did !== me) {
          throw new Error('This post belongs to another account. You can only delete posts made by the connected account.');
        }
        const existed = await blueskyRefs.recordExists({ agent, repo: me, collection: blueskyRefs.POST_COLLECTION, rkey: ref.rkey });
        await agent.deletePost(ref.uri);
        return { deleted: true, existed, uri: ref.uri, deletedAt: new Date().toISOString() };
      },
    });
  },
});

