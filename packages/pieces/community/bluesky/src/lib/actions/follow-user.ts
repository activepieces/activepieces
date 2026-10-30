import { createAction } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { followOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';

export const followUser = createAction({
  auth: blueskyAuth,
  name: 'follow_user',
  classification: 'WRITE',
  displayName: 'Follow User',
  description: 'Follow a Bluesky account',
  audience: 'both',
  outputSchema: followOutputSchema,
  aiMetadata: {
    description:
      'Follows a Bluesky account given its handle, DID or profile link, and returns the existing follow when the account is already followed. Use Unfollow User to undo. Idempotent: a repeat call does not create a second follow.',
    idempotent: true,
  },
  props: {
    actor: blueskyProps.actorProperty({ description: 'Handle (alice.bsky.social), DID or profile link of the account to follow.' }),
  },
  async run({ auth, propsValue }) {
    blueskyRefs.parseActorInput(propsValue.actor);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'follow the account',
      fn: async (agent) => {
        const profile = await blueskyRefs.fetchProfile({ agent, input: propsValue.actor });
        if (profile.did === blueskyClient.sessionDid(agent)) {
          throw new Error('The connected account cannot follow itself.');
        }
        const existing = profile.viewer?.following;
        const followUri = existing ?? (await agent.follow(profile.did)).uri;
        return { followUri, did: profile.did, handle: profile.handle, alreadyFollowing: Boolean(existing) };
      },
    });
  },
});
