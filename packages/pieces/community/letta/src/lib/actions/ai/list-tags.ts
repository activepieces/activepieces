import { createAction, Property } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';

export const lettaListTags = createAction({
  auth: lettaAuth,
  name: 'letta_list_tags',
  displayName: 'List Tags',
  description: 'Lists tags used on agents.',
  classification: 'SEARCH',
  audience: 'ai',
  outputSchema: lettaSchemas.tagList,
  aiMetadata: {
    description:
      'Lists the distinct tags used on Letta agents, alphabetically, optionally filtered by a search text. Use the tags with List Agents. Returns one page plus next_cursor (the last tag). Read-only.',
    idempotent: true,
  },
  props: {
    query_text: Property.ShortText({ displayName: 'Search Text', description: 'Only tags containing this text.', required: false }),
    limit: lettaProps.aiLimit({ max: 100 }),
    after: lettaProps.aiAfter(),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const limit = lettaApi.resolveLimit({ limit: propsValue.limit, max: 100, fallback: 50 });
    const tags = await lettaApi.callLetta(() =>
      client.tags.list({ limit, after: lettaApi.optionalText(propsValue.after), query_text: lettaApi.optionalText(propsValue.query_text) })
    );
    return lettaApi.toPage({ items: tags, limit, cursorOf: (tag) => tag });
  },
});
