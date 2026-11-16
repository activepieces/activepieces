import { createAction, Property } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';
import type { ToolListParams } from '../../common/types';

export const lettaListTools = createAction({
  auth: lettaAuth,
  name: 'letta_list_tools',
  displayName: 'List Tools',
  description: 'Lists tools available in the project.',
  classification: 'SEARCH',
  audience: 'ai',
  outputSchema: lettaSchemas.toolList,
  aiMetadata: {
    description:
      'Lists tools in the Letta project (built-in and custom), optionally by exact name or a search text. Use to find a tool ID for Attach Tool or Create Agent. Returns one page plus next_cursor. Read-only.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Exact tool name.', required: false }),
    search: Property.ShortText({ displayName: 'Search Text', description: 'Partial tool name to search for.', required: false }),
    limit: lettaProps.aiLimit({ max: 100 }),
    after: lettaProps.aiAfter(),
    order: lettaProps.aiOrder(),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const limit = lettaApi.resolveLimit({ limit: propsValue.limit, max: 100, fallback: 50 });
    const query: ToolListParams = {
      limit,
      after: lettaApi.optionalText(propsValue.after),
      order: lettaProps.toOrder(propsValue.order),
      name: lettaApi.optionalText(propsValue.name),
      search: lettaApi.optionalText(propsValue.search),
    };
    const page = await lettaApi.callLetta(() => client.tools.list(query));
    return lettaApi.toPage({ items: page.getPaginatedItems().map(lettaApi.mapTool), limit, cursorOf: (tool) => tool.id });
  },
});
