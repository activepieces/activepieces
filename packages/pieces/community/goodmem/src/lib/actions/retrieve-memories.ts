import { createAction, Property } from '@activepieces/pieces-framework';
import { goodmemAuth } from '../../index';
import { extractAuthFromContext, goodmemOutputSchemas, llmDropdown, multiSpaceDropdown, rerankerDropdown } from '../common';
import { goodmemApi } from '../common/client';

export const retrieveMemories = createAction({
  auth: goodmemAuth,
  name: 'retrieve_memories',
  classification: 'SEARCH',
  displayName: 'Retrieve Memories',
  description: 'Perform similarity-based semantic retrieval across one or more spaces. Returns matching chunks ranked by relevance, with optional full memory definitions.',
  audience: 'human',
  outputSchema: goodmemOutputSchemas.retrieve,
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description: 'A natural language query used to find semantically similar memory chunks',
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
      description: 'Fetch the full memory metadata (source document info, processing status) alongside the matched chunks',
      required: false,
      defaultValue: true,
    }),
    waitForIndexing: Property.Checkbox({
      displayName: 'Wait for Indexing',
      description: 'Retry for up to 60 seconds when no results are found. Enable this when memories were just added and may still be undergoing chunking and embedding',
      required: false,
      defaultValue: true,
    }),
    rerankerId: rerankerDropdown,
    llmId: llmDropdown,
    relevanceThreshold: Property.Number({
      displayName: 'Relevance Threshold',
      description: 'Minimum score (0-1) for including results. Only used when Reranker or LLM is set.',
      required: false,
    }),
    llmTemperature: Property.Number({
      displayName: 'LLM Temperature',
      description: 'Creativity setting for LLM generation (0-2). Only used when LLM ID is set.',
      required: false,
    }),
    chronologicalResort: Property.Checkbox({
      displayName: 'Chronological Resort',
      description: 'Reorder results by creation time instead of relevance score',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { query, spaceIds, maxResults, includeMemoryDefinition, waitForIndexing, rerankerId, llmId, relevanceThreshold, llmTemperature, chronologicalResort } = context.propsValue;
    const auth = extractAuthFromContext(context.auth);
    return goodmemApi.retrieveMemoriesRequest({
      auth,
      waitForIndexing: waitForIndexing !== false,
      params: {
        query,
        spaceIds: Array.isArray(spaceIds) ? spaceIds : [],
        maxResults: maxResults ?? undefined,
        fetchMemory: includeMemoryDefinition !== false,
        rerankerId: rerankerId ?? undefined,
        llmId: llmId ?? undefined,
        relevanceThreshold: relevanceThreshold ?? undefined,
        llmTemperature: llmTemperature ?? undefined,
        chronologicalResort: chronologicalResort === true,
      },
    });
  },
});
