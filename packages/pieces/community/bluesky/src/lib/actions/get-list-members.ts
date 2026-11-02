import { createAction } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { listMembersOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';
import { blueskyMappers } from '../common/mappers';

export const getListMembers = createAction({
  auth: blueskyAuth,
  name: 'get_list_members',
  classification: 'SEARCH',
  displayName: 'Get List Members',
  description: 'List the accounts on a Bluesky list',
  audience: 'both',
  outputSchema: listMembersOutputSchema,
  aiMetadata: {
    description:
      'Returns a Bluesky list\'s details and one page of its member accounts, given the list\'s bsky.app link or AT-URI, with cursor pagination. Use List Lists to find a list first. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    list: blueskyProps.listInputProperty(),
    limit: blueskyProps.limitProperty(),
    cursor: blueskyProps.cursorProperty(),
  },
  async run({ auth, propsValue }) {
    blueskyRefs.parseListInput(propsValue.list);
    const limit = blueskyProps.parseLimit(propsValue.limit);
    const cursor = blueskyProps.parseCursor(propsValue.cursor);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'get the list members',
      fn: async (agent) => {
        const ref = await blueskyRefs.resolveListRef({ agent, input: propsValue.list });
        const response = await agent.app.bsky.graph.getList({ list: ref.uri, limit, cursor });
        return {
          list: blueskyMappers.listItem(response.data.list),
          ...blueskyMappers.pageOf({
            items: response.data.items.map((item) => ({ listItemUri: item.uri, ...blueskyMappers.profileItem(item.subject) })),
            cursor: response.data.cursor,
          }),
        };
      },
    });
  },
});
