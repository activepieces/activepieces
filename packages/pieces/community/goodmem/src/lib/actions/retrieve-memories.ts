import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { goodmemAuth } from '../../index';
import { getBaseUrl, getCommonHeaders, extractAuthFromContext } from '../common';

export const retrieveMemories = createAction({
  auth: goodmemAuth,
  name: 'retrieve_memories',
  displayName: 'Retrieve Memories',
  description: 'Perform similarity-based semantic retrieval across one or more spaces. Returns matching chunks ranked by relevance, with optional full memory definitions.',
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description: 'A natural language query used to find semantically similar memory chunks',
      required: true,
    }),
    spaceIds: Property.ShortText({
      displayName: 'Space IDs',
      description: 'One or more space UUIDs to search across, separated by commas (e.g., "id1,id2"). Returned by Create Space.',
      required: true,
    }),
    maxResults: Property.Number({
      displayName: 'Maximum Results',
      description: 'Maximum number of matching chunks to return',
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
  },
  async run(context) {
    const { query, spaceIds, maxResults, includeMemoryDefinition, waitForIndexing } = context.propsValue;
    const { baseUrl: rawBaseUrl, apiKey } = extractAuthFromContext(context.auth);
    const baseUrl = getBaseUrl(rawBaseUrl);

    if (!spaceIds || spaceIds.trim() === '') {
      return {
        success: false,
        error: 'At least one Space ID is required.',
      };
    }

    const spaceKeys = spaceIds
      .split(',')
      .map((id: string) => id.trim())
      .filter((id: string) => id.length > 0)
      .map((spaceId: string) => ({ spaceId }));

    if (spaceKeys.length === 0) {
      return {
        success: false,
        error: 'At least one valid Space ID is required.',
      };
    }

    const requestBody: any = {
      message: query,
      spaceKeys,
      requestedSize: maxResults || 5,
      fetchMemory: includeMemoryDefinition !== false,
    };

    const maxWaitMs = 60000;
    const pollIntervalMs = 5000;
    const shouldWait = waitForIndexing !== false;
    const startTime = Date.now();
    let lastResult: any = null;

    try {
      do {
        const retrieveHeaders = {
          ...getCommonHeaders(apiKey),
          'Accept': 'application/x-ndjson',
        };

        const response = await httpClient.sendRequest({
          method: HttpMethod.POST,
          url: `${baseUrl}/v1/memories:retrieve`,
          headers: retrieveHeaders,
          body: requestBody,
        });

        const results: any[] = [];
        const memories: any[] = [];
        let resultSetId = '';

        // GoodMem API may return NDJSON or SSE format
        const responseText = typeof response.body === 'string' ? response.body : JSON.stringify(response.body);
        const lines = responseText.trim().split('\n');

        lines.forEach((line: string) => {
          let jsonStr = line.trim();
          if (!jsonStr) return;

          // Handle SSE format: extract JSON from "data: {...}" lines
          if (jsonStr.startsWith('data:')) {
            jsonStr = jsonStr.substring(5).trim();
          }
          // Skip SSE event type lines and close events
          if (jsonStr.startsWith('event:') || jsonStr === '') return;

          try {
            const item = JSON.parse(jsonStr);
            
            if (item.resultSetBoundary) {
              resultSetId = item.resultSetBoundary.resultSetId;
            } else if (item.memoryDefinition) {
              memories.push(item.memoryDefinition);
            } else if (item.retrievedItem) {
              results.push({
                chunkId: item.retrievedItem.chunk?.chunk?.chunkId,
                chunkText: item.retrievedItem.chunk?.chunk?.chunkText,
                memoryId: item.retrievedItem.chunk?.chunk?.memoryId,
                relevanceScore: item.retrievedItem.chunk?.relevanceScore,
                memoryIndex: item.retrievedItem.chunk?.memoryIndex,
              });
            }
          } catch (parseError) {
            // Skip non-JSON lines (e.g., SSE event types, close events)
          }
        });

        lastResult = {
          success: true,
          resultSetId,
          results,
          memories,
          totalResults: results.length,
          query,
        };

        if (results.length > 0 || !shouldWait) {
          return lastResult;
        }

        const elapsed = Date.now() - startTime;
        if (elapsed >= maxWaitMs) {
          return {
            ...lastResult,
            message: 'No results found after waiting 60 seconds for indexing. Memories may still be processing.',
          };
        }

        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      } while (true);
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to retrieve memories',
        details: error.response?.body || error,
      };
    }
  },
});
