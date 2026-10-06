import { createAction, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { listListOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';
import { blueskyMappers } from '../common/mappers';

export const listMyLists = createAction({
  auth: blueskyAuth,
  name: 'list_my_lists',
  classification: 'SEARCH',
  displayName: 'List Lists',
  description: 'List the user lists and moderation lists an account created',
  audience: 'both',
  outputSchema: listListOutputSchema,
  aiMetadata: {
    description:
      'Lists the curation and moderation lists created by a Bluesky account (the connected account when left empty), optionally only one kind, with cursor pagination. Use Get List Members to read who is on a list. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    actor: blueskyProps.optionalActorProperty({ description: 'Handle, DID or profile link of the list owner. Leave empty for your own lists.' }),
    purpose: Property.StaticDropdown({
      displayName: 'Kind',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All lists', value: 'all' },
          { label: 'User lists (curation)', value: 'app.bsky.graph.defs#curatelist' },
          { label: 'Moderation lists', value: 'app.bsky.graph.defs#modlist' },
          { label: 'Reference lists (starter packs)', value: 'app.bsky.graph.defs#referencelist' },
        ],
      },
    }),
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
      action: 'list the lists',
      fn: async (agent) => {
        const actor = propsValue.actor && propsValue.actor.trim() !== '' ? blueskyRefs.parseActorInput(propsValue.actor) : blueskyClient.sessionDid(agent);
        const response = await agent.app.bsky.graph.getLists({ actor, limit, cursor });
        const purpose = propsValue.purpose && propsValue.purpose !== 'all' ? propsValue.purpose : undefined;
        const lists = purpose ? response.data.lists.filter((list) => list.purpose === purpose) : response.data.lists;
        return blueskyMappers.pageOf({ items: lists.map(blueskyMappers.listItem), cursor: response.data.cursor });
      },
    });
  },
});
