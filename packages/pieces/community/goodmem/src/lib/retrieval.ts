import {
  AbstractReplyResponseShape,
  ChunkReferenceResponseShape,
  GoodMemStatusResponseShape,
  MemoriesRetrieveParams,
  MemoryResponseShape,
  RetrieveMemoryEventResponseShape,
} from '@pairsystems/goodmem';

function buildRequest({
  query,
  spaceIds,
  maxResults = 5,
  includeMemoryDefinition = true,
  rerankerId,
  llmId,
  relevanceThreshold,
  llmTemperature,
  chronologicalResort,
  filter,
}: RetrievalOptions): MemoriesRetrieveParams {
  if (!spaceIds.length) {
    throw new Error('Select at least one space.');
  }
  if (!Number.isInteger(maxResults) || maxResults < 1) {
    throw new Error('Maximum results must be a positive integer.');
  }
  if (relevanceThreshold != null && !rerankerId) {
    throw new Error('Select a reranker to use a relevance threshold.');
  }
  if (chronologicalResort && !rerankerId) {
    throw new Error('Chronological resort currently requires a reranker.');
  }
  const request: MemoriesRetrieveParams = {
    message: query,
    spaceKeys: spaceIds.map((spaceId) => ({
      spaceId,
      ...(filter?.trim() ? { filter } : {}),
    })),
    requestedSize: maxResults,
    fetchMemory: includeMemoryDefinition,
  };
  if (rerankerId || llmId) {
    request.postProcessor = {
      name: 'com.goodmem.retrieval.postprocess.ChatPostProcessorFactory',
      config: {
        max_results: maxResults,
        ...(rerankerId ? { reranker_id: rerankerId } : {}),
        ...(llmId ? { llm_id: llmId } : {}),
        ...(relevanceThreshold != null
          ? { relevance_threshold: relevanceThreshold }
          : {}),
        ...(llmId && llmTemperature != null
          ? { llm_temp: llmTemperature }
          : {}),
        ...(chronologicalResort ? { chronological_resort: true } : {}),
      },
    };
  }
  return request;
}

async function assemble(
  events: AsyncIterable<RetrieveMemoryEventResponseShape>
) {
  const sets = new Map<string, ResultSet>();
  const memories: MemoryResponseShape[] = [];
  const memoryById = new Map<string, MemoryResponseShape>();
  const statuses: RetrievalStatus[] = [];
  const replies: AbstractReplyResponseShape[] = [];
  for await (const event of events) {
    const boundary = event.resultSetBoundary;
    if (boundary) {
      const set =
        sets.get(boundary.resultSetId) ?? newResultSet(boundary.resultSetId);
      if (boundary.kind === 'BEGIN') {
        set.started = true;
      }
      set.ended = boundary.kind === 'END';
      sets.set(set.id, set);
    }
    const reference = event.retrievedItem?.chunk;
    if (reference) {
      const set =
        sets.get(reference.resultSetId) ?? newResultSet(reference.resultSetId);
      set.chunks.push(reference);
      set.ended = false;
      sets.set(set.id, set);
    }
    if (event.memoryDefinition) {
      memories.push(event.memoryDefinition);
      memoryById.set(event.memoryDefinition.memoryId, event.memoryDefinition);
    }
    if (event.status) {
      statuses.push(event.status);
    }
    if (event.abstractReply) {
      replies.push(event.abstractReply);
    }
  }
  const stages = [...sets.values()].reverse();
  const selected = stages.find((set) => set.started && set.ended) ?? stages[0];
  const abstractReply = replies
    .reverse()
    .find(
      (reply) =>
        !selected || !reply.resultSetId || reply.resultSetId === selected.id
    );
  for (const set of stages) {
    if (!set.started || !set.ended) {
      statuses.push({
        code: 'INCOMPLETE_RESULT_SET',
        origin: 'client',
        message:
          'Retrieval ended without a complete result set. Returned results may be incomplete or from an earlier stage.',
        details: { result_set_id: set.id },
      });
    }
  }
  const partial = statuses.some(
    (status) =>
      status.code !== 'FEATURE_DISABLED' &&
      status.code !== 'LLM_CAPABILITY_INFERRED'
  );
  const chunks = selected?.chunks ?? [];
  if (partial && chunks.length === 0 && !abstractReply?.text) {
    throw new Error(
      statuses.map((status) => `${status.code}: ${status.message}`).join('; ')
    );
  }
  const results = chunks.map((reference) => {
    const memory = memoryById.get(reference.chunk.memoryId);
    return {
      chunkId: reference.chunk.chunkId,
      chunkText: reference.chunk.chunkText,
      memoryId: reference.chunk.memoryId,
      relevanceScore: reference.relevanceScore,
      memoryIndex: reference.memoryIndex,
      resultSetId: reference.resultSetId,
      spaceId: memory?.spaceId,
      source: memory?.metadata?.['source'],
      metadata: reference.chunk.metadata ?? {},
      memoryMetadata: memory?.metadata ?? {},
    };
  });
  return {
    success: true,
    partial,
    statuses,
    resultSetId: selected?.id,
    results,
    memories,
    totalResults: results.length,
    ...(abstractReply ? { abstractReply } : {}),
  };
}

function newResultSet(id: string): ResultSet {
  return { id, started: false, ended: false, chunks: [] };
}

export const retrieval = { buildRequest, assemble };

type ResultSet = {
  id: string;
  started: boolean;
  ended: boolean;
  chunks: ChunkReferenceResponseShape[];
};

type RetrievalStatus =
  | GoodMemStatusResponseShape
  | {
      code: 'INCOMPLETE_RESULT_SET';
      origin: 'client';
      message: string;
      details: { result_set_id: string };
    };

type RetrievalOptions = {
  query: string;
  spaceIds: string[];
  maxResults?: number;
  includeMemoryDefinition?: boolean;
  rerankerId?: string;
  llmId?: string;
  relevanceThreshold?: number;
  llmTemperature?: number;
  chronologicalResort?: boolean;
  filter?: string;
};
