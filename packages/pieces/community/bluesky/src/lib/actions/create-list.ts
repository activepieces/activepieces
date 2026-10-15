import { createAction, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { createListOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyRefs } from '../common/refs';
import { blueskyCompose } from '../common/compose';

const MAX_LIST_NAME = 64;
const MAX_LIST_DESCRIPTION = 300;

export const createList = createAction({
  auth: blueskyAuth,
  name: 'create_list',
  classification: 'WRITE',
  displayName: 'Create List',
  description: 'Create a user list or moderation list',
  audience: 'both',
  outputSchema: createListOutputSchema,
  aiMetadata: {
    description:
      'Creates a new list owned by the connected Bluesky account: a user (curation) list for feeds and grouping, or a moderation list for bulk mute/block. Use Add User to List afterwards to fill it. Not idempotent: each call creates another list, even with the same name.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: `List name (max ${MAX_LIST_NAME} characters).`, required: true }),
    purpose: Property.StaticDropdown({
      displayName: 'Kind',
      required: true,
      defaultValue: 'app.bsky.graph.defs#curatelist',
      options: {
        options: [
          { label: 'User list (curation)', value: 'app.bsky.graph.defs#curatelist' },
          { label: 'Moderation list', value: 'app.bsky.graph.defs#modlist' },
        ],
      },
    }),
    description: Property.LongText({ displayName: 'Description', description: `Optional (max ${MAX_LIST_DESCRIPTION} characters).`, required: false }),
  },
  async run({ auth, propsValue }) {
    const name = propsValue.name.trim();
    if (name === '' || blueskyCompose.graphemeLength(name) > MAX_LIST_NAME) {
      throw new Error(`Name must be between 1 and ${MAX_LIST_NAME} characters.`);
    }
    const description = propsValue.description?.trim() ?? '';
    if (blueskyCompose.graphemeLength(description) > MAX_LIST_DESCRIPTION) {
      throw new Error(`Description must be at most ${MAX_LIST_DESCRIPTION} characters.`);
    }
    const purpose = propsValue.purpose;
    if (purpose !== 'app.bsky.graph.defs#curatelist' && purpose !== 'app.bsky.graph.defs#modlist') {
      throw new Error('Kind must be a user list or a moderation list.');
    }
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'create the list',
      fn: async (agent) => {
        const me = blueskyClient.sessionDid(agent);
        const createdAt = new Date().toISOString();
        const response = await agent.app.bsky.graph.list.create(
          { repo: me },
          { name, purpose, createdAt, ...(description !== '' ? { description } : {}) },
        );
        return {
          uri: response.uri,
          cid: response.cid,
          url: blueskyRefs.postWebUrl({ uri: response.uri, handle: agent.session?.handle }),
          name,
          purpose,
          description,
          createdAt,
        };
      },
    });
  },
});
