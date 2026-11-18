import { createAction, Property } from '@activepieces/pieces-framework';
import { goodmemAuth } from '../../index';
import { extractAuthFromContext, goodmemOutputSchemas } from '../common';
import { goodmemApi, goodmemBuilders } from '../common/client';

export const aiListMemories = createAction({
  auth: goodmemAuth,
  name: 'ai_list_memories',
  classification: 'READ',
  displayName: 'List Memories',
  description: 'List the memories stored in a space.',
  audience: 'ai',
  aiMetadata: { description: 'Lists the memories stored in one GoodMem space, with their IDs, content type, processing status and metadata. Use it to find a memory ID for Get Memory or Delete Memory, or to check whether stored content has finished processing. Needs a space ID (get one from List Spaces). Optionally narrow with a filter expression such as val(\'$.source\') = \'docs\' or exists(\'$.source\'). Returns a nextToken when more memories exist. Read-only and idempotent.', idempotent: true },
  outputSchema: goodmemOutputSchemas.listMemories,
  props: {
    spaceId: Property.ShortText({
      displayName: 'Space ID',
      description: 'The ID of the space whose memories to list (from List Spaces)',
      required: true,
    }),
    filter: Property.ShortText({
      displayName: 'Filter',
      description: "Optional metadata filter, for example val('$.source') = 'docs'",
      required: false,
    }),
    maxResults: Property.Number({
      displayName: 'Maximum Results',
      description: 'How many memories to return (1-1000)',
      required: false,
      defaultValue: 50,
    }),
    nextToken: Property.ShortText({
      displayName: 'Next Page Token',
      description: 'The nextToken from a previous call, to fetch the following page',
      required: false,
    }),
  },
  async run(context) {
    const { spaceId, filter, maxResults, nextToken } = context.propsValue;
    const size = maxResults ?? 50;
    if (!Number.isInteger(size) || size < 1 || size > 1000) {
      throw new Error('Maximum Results must be a whole number between 1 and 1000');
    }
    const page = await goodmemApi.listMemoriesPage({
      auth: extractAuthFromContext(context.auth),
      spaceId: goodmemBuilders.requireText({ value: spaceId, label: 'Space ID' }),
      filter: filter?.trim() || undefined,
      maxResults: size,
      nextToken: nextToken?.trim() || undefined,
    });
    return { memories: page.memories, count: page.memories.length, nextToken: page.nextToken };
  },
});
