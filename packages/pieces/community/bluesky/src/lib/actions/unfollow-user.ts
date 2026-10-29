import { createAction } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { unfollowOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';

export const unfollowUser = createAction({
  auth: blueskyAuth,
  name: 'unfollow_user',
  classification: 'WRITE',
  displayName: 'Unfollow User',
  description: 'Stop following a Bluesky account',
  audience: 'both',
  outputSchema: unfollowOutputSchema,
  aiMetadata: {
    description:
      'Stops following a Bluesky account given its handle, DID or profile link. Use to undo Follow User. Idempotent: when the account is not followed it changes nothing and returns removed=false.',
    idempotent: true,
  },
  props: {
    actor: blueskyProps.actorProperty({ description: 'Handle (alice.bsky.social), DID or profile link of the account to unfollow.' }),
  },
  async run({ auth, propsValue }) {
    blueskyRefs.parseActorInput(propsValue.actor);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'unfollow the account',
      fn: async (agent) => {
        const profile = await blueskyRefs.fetchProfile({ agent, input: propsValue.actor });
        const followUri = profile.viewer?.following;
        if (followUri) {
          await agent.deleteFollow(followUri);
        }
        return { removed: Boolean(followUri), did: profile.did, handle: profile.handle, followUri: followUri ?? null };
      },
    });
  },
});
