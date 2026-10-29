import { createAction } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { muteOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';

export const unmuteUser = createAction({
  auth: blueskyAuth,
  name: 'unmute_user',
  classification: 'WRITE',
  displayName: 'Unmute User',
  description: 'Unmute a Bluesky account',
  audience: 'both',
  outputSchema: muteOutputSchema,
  aiMetadata: {
    description:
      'Unmutes a Bluesky account given its handle, DID or profile link so its posts show again. Use to undo Mute User. Idempotent: unmuting an account that is not muted changes nothing.',
    idempotent: true,
  },
  props: {
    actor: blueskyProps.actorProperty({ description: 'Handle (alice.bsky.social), DID or profile link of the account to unmute.' }),
  },
  async run({ auth, propsValue }) {
    blueskyRefs.parseActorInput(propsValue.actor);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'unmute the account',
      fn: async (agent) => {
        const profile = await blueskyRefs.fetchProfile({ agent, input: propsValue.actor });
        await agent.unmute(profile.did);
        return { muted: false, wasMuted: Boolean(profile.viewer?.muted), did: profile.did, handle: profile.handle };
      },
    });
  },
});
