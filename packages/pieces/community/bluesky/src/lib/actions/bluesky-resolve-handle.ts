import { createAction, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { resolveHandleOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyRefs } from '../common/refs';

export const blueskyResolveHandle = createAction({
  auth: blueskyAuth,
  name: 'bluesky_resolve_handle',
  classification: 'READ',
  displayName: 'Resolve Handle (AI)',
  description: 'Turn a Bluesky handle into its permanent DID',
  audience: 'ai',
  outputSchema: resolveHandleOutputSchema,
  aiMetadata: {
    description:
      'Resolves a Bluesky handle (or profile link) to the account\'s permanent DID, which stays the same when the handle changes. Use Get Profile when you also need the name, bio or counts. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    handle: Property.ShortText({ displayName: 'Handle', description: 'For example alice.bsky.social, @alice or https://bsky.app/profile/alice.bsky.social.', required: true }),
  },
  async run({ auth, propsValue }) {
    const handle = blueskyRefs.parseActorInput(propsValue.handle);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'resolve the handle',
      fn: async (agent) => {
        if (blueskyRefs.isDid(handle)) {
          return { handle: null, did: handle };
        }
        const did = await blueskyRefs.resolveRepoDid({ agent, repo: handle });
        return { handle, did };
      },
    });
  },
});
