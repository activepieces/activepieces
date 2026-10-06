import { createAction } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { blockOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';

export const blockUser = createAction({
  auth: blueskyAuth,
  name: 'block_user',
  classification: 'WRITE',
  displayName: 'Block User',
  description: 'Block a Bluesky account',
  audience: 'both',
  outputSchema: blockOutputSchema,
  aiMetadata: {
    description:
      'Blocks a Bluesky account given its handle, DID or profile link, so neither side sees or interacts with the other; blocks are public on Bluesky. Use Mute User for a private alternative and Unblock User to undo. Idempotent: an existing block is returned instead of creating another.',
    idempotent: true,
  },
  props: {
    actor: blueskyProps.actorProperty({ description: 'Handle (alice.bsky.social), DID or profile link of the account to block.' }),
  },
  async run({ auth, propsValue }) {
    blueskyRefs.parseActorInput(propsValue.actor);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'block the account',
      fn: async (agent) => {
        const me = blueskyClient.sessionDid(agent);
        const profile = await blueskyRefs.fetchProfile({ agent, input: propsValue.actor });
        if (profile.did === me) {
          throw new Error('The connected account cannot block itself.');
        }
        const existing = profile.viewer?.blocking;
        const blockUri =
          existing ??
          (await agent.app.bsky.graph.block.create({ repo: me }, { subject: profile.did, createdAt: new Date().toISOString() })).uri;
        return { blockUri, did: profile.did, handle: profile.handle, alreadyBlocked: Boolean(existing) };
      },
    });
  },
});
