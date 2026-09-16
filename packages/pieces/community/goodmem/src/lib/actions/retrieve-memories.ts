import { createAction, Property } from '@activepieces/pieces-framework';
import { createGoodmemClient } from '../client';
import { goodmemAuth } from '../auth';
import { retrieval } from '../retrieval';
import { multiSpaceDropdown, rerankerDropdown, llmDropdown } from '../common';

export const retrieveMemories = createAction({
  auth: goodmemAuth,
  name: 'retrieve_memories',
  displayName: 'Retrieve Memories',
  description:
    'Perform similarity-based semantic retrieval across one or more spaces. Returns matching chunks ranked by relevance, with optional full memory definitions.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs a semantic (vector-similarity) search over one or more GoodMem spaces using a natural-language query and returns the matching memory chunks ranked by relevance, optionally reranked or LLM-post-processed. Use it to recall stored knowledge relevant to a question; requires at least one space ID. Returns an empty result immediately when nothing matches. A partial flag and server statuses identify degraded results.',
    idempotent: true,
  },
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description:
        'A natural language query used to find semantically similar memory chunks',
      required: true,
    }),
    spaceIds: multiSpaceDropdown,
    maxResults: Property.Number({
      displayName: 'Maximum Results',
      description: 'Limit the number of returned memories',
      required: false,
      defaultValue: 5,
    }),
    includeMemoryDefinition: Property.Checkbox({
      displayName: 'Include Memory Definition',
      description:
        'Fetch the full memory metadata (source document info, processing status) alongside the matched chunks',
      required: false,
      defaultValue: true,
    }),
    filter: Property.LongText({
      displayName: 'Metadata Filter',
      description:
        "Optional GoodMem filter applied to every selected space, for example: CAST(val('$.tenant') AS text) = 'acme'. See https://docs.goodmem.ai/docs/reference/filter-expressions/",
      required: false,
    }),
    rerankerId: rerankerDropdown,
    llmId: llmDropdown,
    relevanceThreshold: Property.Number({
      displayName: 'Relevance Threshold',
      description:
        'Minimum reranker score for including results. Requires a reranker; score ranges depend on the selected model.',
      required: false,
    }),
    llmTemperature: Property.Number({
      displayName: 'LLM Temperature',
      description:
        'Creativity setting for LLM generation (0-2). Only used when LLM ID is set.',
      required: false,
    }),
    chronologicalResort: Property.Checkbox({
      displayName: 'Chronological Resort',
      description:
        'Order results by memory creation time, oldest first. Currently requires successful reranking; check partial for failures.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const request = retrieval.buildRequest(context.propsValue);
    const result = await retrieval.assemble(
      createGoodmemClient(context.auth.props).memories.retrieve(request)
    );
    return { ...result, query: context.propsValue.query };
  },
});
