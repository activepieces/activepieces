import { createAction, Property } from '@activepieces/pieces-framework';
import { goodmemAuth } from '../../index';
import { extractAuthFromContext, goodmemOutputSchemas } from '../common';
import { goodmemApi } from '../common/client';

export const aiRetrieveMemories = createAction({
  auth: goodmemAuth,
  name: 'ai_retrieve_memories',
  classification: 'SEARCH',
  displayName: 'Retrieve Memories',
  description: 'Semantic search over one or more spaces.',
  audience: 'ai',
  aiMetadata: { description: 'Runs a semantic (vector-similarity) search over one or more GoodMem spaces with a natural-language query and returns matching chunks ranked by relevance, with the memory IDs they came from. Needs space IDs (from List Spaces). Optionally pass a reranker ID or LLM ID (from List Models); with an LLM the result also carries a generated answer. Returns immediately by default; set Wait for Indexing to yes to retry for up to 60 seconds when memories were just stored. Read-only and idempotent.', idempotent: true },
  outputSchema: goodmemOutputSchemas.retrieve,
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description: 'The natural-language question or text to search for',
      required: true,
    }),
    spaceIds: Property.Array({
      displayName: 'Space IDs',
      description: 'IDs of the spaces to search',
      required: true,
    }),
    maxResults: Property.Number({
      displayName: 'Maximum Results',
      description: 'How many chunks to return (default 5)',
      required: false,
    }),
    rerankerId: Property.ShortText({
      displayName: 'Reranker ID',
      description: 'Optional reranker model ID',
      required: false,
    }),
    llmId: Property.ShortText({
      displayName: 'LLM ID',
      description: 'Optional LLM ID that generates an answer from the retrieved chunks',
      required: false,
    }),
    relevanceThreshold: Property.Number({
      displayName: 'Relevance Threshold',
      description: 'Minimum score (0-1); only applied when a reranker or LLM is set',
      required: false,
    }),
    waitForIndexing: Property.StaticDropdown<string>({
      displayName: 'Wait for Indexing',
      description: 'yes = retry for up to 60 seconds when nothing is found yet',
      required: false,
      defaultValue: 'no',
      options: {
        disabled: false,
        options: [
          { label: 'No', value: 'no' },
          { label: 'Yes', value: 'yes' },
        ],
      },
    }),
  },
  async run(context) {
    const { query, spaceIds, maxResults, rerankerId, llmId, relevanceThreshold, waitForIndexing } = context.propsValue;
    const ids: string[] = [];
    for (const id of spaceIds ?? []) {
      if (typeof id === 'string') {
        ids.push(id);
      }
    }
    return goodmemApi.retrieveMemoriesRequest({
      auth: extractAuthFromContext(context.auth),
      waitForIndexing: waitForIndexing === 'yes',
      params: {
        query,
        spaceIds: ids,
        maxResults: maxResults ?? undefined,
        fetchMemory: true,
        rerankerId: rerankerId?.trim() || undefined,
        llmId: llmId?.trim() || undefined,
        relevanceThreshold: relevanceThreshold ?? undefined,
      },
    });
  },
});
