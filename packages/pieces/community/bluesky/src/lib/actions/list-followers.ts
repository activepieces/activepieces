import { createAction } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { profileListOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';
import { blueskyMappers } from '../common/mappers';

export const listFollowers = createAction({
  auth: blueskyAuth,
  name: 'list_followers',
  classification: 'SEARCH',
  displayName: 'List Followers',
  description: 'List the accounts that follow an account',
  audience: 'both',
  outputSchema: profileListOutputSchema,
  aiMetadata: {
    description:
      'Lists the accounts that follow a Bluesky account (the connected account when left empty), newest follow first, with cursor pagination. Use List Following for the accounts it follows. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    actor: blueskyProps.optionalActorProperty({ description: 'Handle (alice.bsky.social), DID or profile link. Leave empty for your own account.' }),
    limit: blueskyProps.limitProperty(),
    cursor: blueskyProps.cursorProperty(),
  },
  async run({ auth, propsValue }) {
    if (propsValue.actor && propsValue.actor.trim() !== '') {
      blueskyRefs.parseActorInput(propsValue.actor);
    }
    const limit = blueskyProps.parseLimit(propsValue.limit);
    const cursor = blueskyProps.parseCursor(propsValue.cursor);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'list the followers',
      fn: async (agent) => {
        const actor = propsValue.actor && propsValue.actor.trim() !== '' ? blueskyRefs.parseActorInput(propsValue.actor) : blueskyClient.sessionDid(agent);
        const response = await agent.getFollowers({ actor, limit, cursor });
        return blueskyMappers.pageOf({ items: response.data.followers.map(blueskyMappers.profileItem), cursor: response.data.cursor });
      },
    });
  },
});
