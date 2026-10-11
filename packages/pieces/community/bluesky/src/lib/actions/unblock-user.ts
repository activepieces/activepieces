import { createAction } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { unblockOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';

export const unblockUser = createAction({
  auth: blueskyAuth,
  name: 'unblock_user',
  classification: 'WRITE',
  displayName: 'Unblock User',
  description: 'Unblock a Bluesky account',
  audience: 'both',
  outputSchema: unblockOutputSchema,
  aiMetadata: {
    description:
      'Removes the connected account\'s block on a Bluesky account given its handle, DID or profile link. Use to undo Block User. Idempotent: when the account is not blocked it changes nothing and returns removed=false.',
    idempotent: true,
  },
  props: {
    actor: blueskyProps.actorProperty({ description: 'Handle (alice.bsky.social), DID or profile link of the account to unblock.' }),
  },
  async run({ auth, propsValue }) {
    blueskyRefs.parseActorInput(propsValue.actor);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'unblock the account',
      fn: async (agent) => {
        const me = blueskyClient.sessionDid(agent);
        const profile = await blueskyRefs.fetchProfile({ agent, input: propsValue.actor });
        const blockUri = profile.viewer?.blocking;
        const parsed = blockUri ? blueskyRefs.parseAtUri(blockUri) : null;
        if (parsed) {
          await agent.app.bsky.graph.block.delete({ repo: me, rkey: parsed.rkey });
        }
        return { removed: parsed !== null, did: profile.did, handle: profile.handle, blockUri: blockUri ?? null };
      },
    });
  },
});
