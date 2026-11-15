import { createAction, Property } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';
import type { BlockListParams } from '../../common/types';

export const lettaListBlocks = createAction({
  auth: lettaAuth,
  name: 'letta_list_blocks',
  displayName: 'List Blocks',
  description: 'Lists memory blocks in the project.',
  classification: 'SEARCH',
  audience: 'ai',
  outputSchema: lettaSchemas.blockList,
  aiMetadata: {
    description:
      'Lists memory blocks across the Letta project, optionally by exact label or a label search. Use to find a block ID to attach, update or delete. Returns one page plus next_cursor. Read-only.',
    idempotent: true,
  },
  props: {
    label: Property.ShortText({ displayName: 'Label', description: 'Exact block label to match.', required: false }),
    label_search: Property.ShortText({ displayName: 'Label Search', description: 'Partial label text to search for.', required: false }),
    limit: lettaProps.aiLimit({ max: 100 }),
    after: lettaProps.aiAfter(),
    order: lettaProps.aiOrder(),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const limit = lettaApi.resolveLimit({ limit: propsValue.limit, max: 100, fallback: 50 });
    const query: BlockListParams = {
      limit,
      after: lettaApi.optionalText(propsValue.after),
      order: lettaProps.toOrder(propsValue.order),
      label: lettaApi.optionalText(propsValue.label),
      label_search: lettaApi.optionalText(propsValue.label_search),
    };
    const page = await lettaApi.callLetta(() => client.blocks.list(query));
    return lettaApi.toPage({ items: page.getPaginatedItems().map(lettaApi.mapBlock), limit, cursorOf: (block) => block.id });
  },
});
