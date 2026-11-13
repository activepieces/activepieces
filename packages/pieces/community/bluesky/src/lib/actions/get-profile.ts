import { createAction } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { profileOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';
import { blueskyMappers } from '../common/mappers';

export const getProfile = createAction({
  auth: blueskyAuth,
  name: 'get_profile',
  classification: 'READ',
  displayName: 'Get Profile',
  description: 'Get a Bluesky profile with follower and post counts',
  audience: 'both',
  outputSchema: profileOutputSchema,
  aiMetadata: {
    description:
      'Returns one Bluesky profile (display name, bio, avatar, follower/following/post counts and the connected account\'s relationship to it) given a handle, DID or profile link; leave the account empty for the connected account itself. Use Search Users when you only have a name. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    actor: blueskyProps.optionalActorProperty({ description: 'Handle (alice.bsky.social), DID or profile link. Leave empty for your own profile.' }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.actor && propsValue.actor.trim() !== '') {
      blueskyRefs.parseActorInput(propsValue.actor);
    }
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'get the profile',
      fn: async (agent) => blueskyMappers.detailedProfile(await blueskyRefs.fetchProfile({ agent, input: propsValue.actor })),
    });
  },
});
