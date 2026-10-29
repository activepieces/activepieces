import { createAction } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { muteOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';

export const muteUser = createAction({
  auth: blueskyAuth,
  name: 'mute_user',
  classification: 'WRITE',
  displayName: 'Mute User',
  description: 'Mute a Bluesky account (private)',
  audience: 'both',
  outputSchema: muteOutputSchema,
  aiMetadata: {
    description:
      'Mutes a Bluesky account given its handle, DID or profile link, hiding its posts from the connected account\'s feeds and notifications; mutes are private. Use Unmute User to undo, or Block User for a public block. Idempotent: muting an already-muted account changes nothing.',
    idempotent: true,
  },
  props: {
    actor: blueskyProps.actorProperty({ description: 'Handle (alice.bsky.social), DID or profile link of the account to mute.' }),
  },
  async run({ auth, propsValue }) {
    blueskyRefs.parseActorInput(propsValue.actor);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'mute the account',
      fn: async (agent) => {
        const profile = await blueskyRefs.fetchProfile({ agent, input: propsValue.actor });
        await agent.mute(profile.did);
        return { muted: true, wasMuted: Boolean(profile.viewer?.muted), did: profile.did, handle: profile.handle };
      },
    });
  },
});
