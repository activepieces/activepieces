import {
  AppConnectionValueForAuthProperty,
  OutputSchema,
  Property,
} from '@activepieces/pieces-framework';
import { goodmemAuth } from '../../index';
import { goodmemApi, goodmemParsers, GoodMemAuthConfig } from './client';

export function extractAuthFromContext(
  auth: AppConnectionValueForAuthProperty<typeof goodmemAuth>
): GoodMemAuthConfig {
  const props = auth.props;
  if (!props || !props.baseUrl || !props.apiKey) {
    throw new Error('Invalid authentication: Base URL and API Key are required');
  }
  return { baseUrl: props.baseUrl, apiKey: props.apiKey };
}

function describeError(error: unknown): string {
  return goodmemParsers.readString({ source: error, key: 'message' }) ?? 'Unknown error';
}

async function loadSpaceOptions(auth: AppConnectionValueForAuthProperty<typeof goodmemAuth> | undefined) {
  if (!auth) {
    return { disabled: true, placeholder: 'Connect your GoodMem account first', options: [] };
  }
  try {
    const spaces = await goodmemApi.listAllSpaces({ auth: extractAuthFromContext(auth) });
    return {
      disabled: false,
      options: spaces.map((space) => ({ label: space.name || space.spaceId, value: space.spaceId })),
    };
  } catch (error) {
    return { disabled: true, placeholder: `Failed to load spaces: ${describeError(error)}`, options: [] };
  }
}

export const spaceIdDropdown = Property.Dropdown<string, true, typeof goodmemAuth>({
  displayName: 'Space',
  description: 'Select a space to use',
  required: true,
  refreshers: ['auth'],
  auth: goodmemAuth,
  options: async ({ auth }) => loadSpaceOptions(auth),
});

export const multiSpaceDropdown = Property.MultiSelectDropdown<string, true, typeof goodmemAuth>({
  displayName: 'Spaces',
  description: 'Select one or more spaces to search across',
  required: true,
  refreshers: ['auth'],
  auth: goodmemAuth,
  options: async ({ auth }) => loadSpaceOptions(auth),
});

export const embedderDropdown = Property.Dropdown<string, true, typeof goodmemAuth>({
  displayName: 'Embedder',
  description: 'The embedder model that converts text into vector representations for similarity search',
  required: true,
  refreshers: ['auth'],
  auth: goodmemAuth,
  async options({ auth }) {
    if (!auth) {
      return { disabled: true, placeholder: 'Connect your GoodMem account first', options: [] };
    }
    try {
      const embedders = (await goodmemApi.listModels({ auth: extractAuthFromContext(auth), kind: 'embedders' })).map(
        goodmemParsers.normalizeEmbedder
      );
      return {
        disabled: false,
        options: embedders.map((embedder) => ({
          label: `${embedder.displayName || embedder.modelIdentifier || embedder.embedderId} (${embedder.modelIdentifier || 'unknown'})`,
          value: embedder.embedderId,
        })),
      };
    } catch (error) {
      return { disabled: true, placeholder: `Failed to load embedders: ${describeError(error)}`, options: [] };
    }
  },
});

export const rerankerDropdown = Property.Dropdown<string, false, typeof goodmemAuth>({
  displayName: 'Reranker',
  description: 'Optional reranker model to improve result ordering',
  required: false,
  refreshers: ['auth'],
  auth: goodmemAuth,
  async options({ auth }) {
    if (!auth) {
      return { disabled: true, placeholder: 'Connect your GoodMem account first', options: [] };
    }
    try {
      const rerankers = (await goodmemApi.listModels({ auth: extractAuthFromContext(auth), kind: 'rerankers' })).map(
        goodmemParsers.normalizeReranker
      );
      return {
        disabled: false,
        options: rerankers.map((reranker) => ({ label: reranker.displayName || reranker.rerankerId, value: reranker.rerankerId })),
      };
    } catch (error) {
      return { disabled: true, placeholder: `Failed to load rerankers: ${describeError(error)}`, options: [] };
    }
  },
});

export const llmDropdown = Property.Dropdown<string, false, typeof goodmemAuth>({
  displayName: 'LLM',
  description: 'Optional LLM to generate contextual responses alongside retrieved chunks',
  required: false,
  refreshers: ['auth'],
  auth: goodmemAuth,
  async options({ auth }) {
    if (!auth) {
      return { disabled: true, placeholder: 'Connect your GoodMem account first', options: [] };
    }
    try {
      const llms = (await goodmemApi.listModels({ auth: extractAuthFromContext(auth), kind: 'llms' })).map(
        goodmemParsers.normalizeLlm
      );
      return {
        disabled: false,
        options: llms.map((llm) => ({ label: llm.displayName || llm.llmId, value: llm.llmId })),
      };
    } catch (error) {
      return { disabled: true, placeholder: `Failed to load LLMs: ${describeError(error)}`, options: [] };
    }
  },
});

const memoryFields: OutputSchema['fields'] = [
  { key: 'memoryId', label: 'Memory ID' },
  { key: 'spaceId', label: 'Space ID' },
  { key: 'contentType', label: 'Content Type' },
  { key: 'processingStatus', label: 'Processing Status' },
  { key: 'metadata', label: 'Metadata' },
  { key: 'createdAt', label: 'Created At' },
];

const spaceResultSchema: OutputSchema = {
  fields: [
    { key: 'spaceId', label: 'Space ID' },
    { key: 'name', label: 'Name' },
    { key: 'embedderId', label: 'Embedder ID' },
    { key: 'reused', label: 'Reused Existing Space', format: 'boolean' },
    { key: 'chunkingConfig', label: 'Chunking Config' },
    { key: 'message', label: 'Message' },
  ],
};

const memoryResultSchema: OutputSchema = { fields: memoryFields };

const retrieveResultSchema: OutputSchema = {
  fields: [
    { key: 'resultSetId', label: 'Result Set ID' },
    {
      key: 'results',
      label: 'Results',
      labelKey: 'chunkText',
      listItems: [
        { key: 'chunkId', label: 'Chunk ID' },
        { key: 'chunkText', label: 'Chunk Text' },
        { key: 'memoryId', label: 'Memory ID' },
        { key: 'relevanceScore', label: 'Relevance Score', format: 'number' },
        { key: 'memoryIndex', label: 'Memory Index', format: 'number' },
      ],
    },
    { key: 'memories', label: 'Memories', labelKey: 'memoryId', listItems: memoryFields },
    { key: 'totalResults', label: 'Total Results', format: 'number' },
    { key: 'query', label: 'Query' },
    { key: 'abstractReply', label: 'Generated Answer' },
  ],
};

const getMemorySchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'memory',
      label: 'Memory',
      children: [...memoryFields, { key: 'originalContent', label: 'Original Content' }],
    },
  ],
};

const deleteMemorySchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'memoryId', label: 'Memory ID' },
    { key: 'message', label: 'Message' },
  ],
};

const listSpacesSchema: OutputSchema = {
  fields: [
    {
      key: 'spaces',
      label: 'Spaces',
      labelKey: 'name',
      listItems: [
        { key: 'spaceId', label: 'Space ID' },
        { key: 'name', label: 'Name' },
        { key: 'createTime', label: 'Created' },
        { key: 'spaceEmbedders', label: 'Embedders' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'nextToken', label: 'Next Page Token' },
  ],
};

const listMemoriesSchema: OutputSchema = {
  fields: [
    { key: 'memories', label: 'Memories', labelKey: 'memoryId', listItems: memoryFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'nextToken', label: 'Next Page Token' },
  ],
};

const listModelsSchema: OutputSchema = {
  fields: [
    {
      key: 'embedders',
      label: 'Embedders',
      labelKey: 'displayName',
      listItems: [
        { key: 'embedderId', label: 'Embedder ID' },
        { key: 'displayName', label: 'Display Name' },
        { key: 'modelIdentifier', label: 'Model' },
      ],
    },
    {
      key: 'rerankers',
      label: 'Rerankers',
      labelKey: 'displayName',
      listItems: [
        { key: 'rerankerId', label: 'Reranker ID' },
        { key: 'displayName', label: 'Display Name' },
        { key: 'modelIdentifier', label: 'Model' },
      ],
    },
    {
      key: 'llms',
      label: 'LLMs',
      labelKey: 'displayName',
      listItems: [
        { key: 'llmId', label: 'LLM ID' },
        { key: 'displayName', label: 'Display Name' },
        { key: 'modelIdentifier', label: 'Model' },
      ],
    },
  ],
};

export const goodmemOutputSchemas = {
  space: spaceResultSchema,
  memory: memoryResultSchema,
  retrieve: retrieveResultSchema,
  getMemory: getMemorySchema,
  deleteMemory: deleteMemorySchema,
  listSpaces: listSpacesSchema,
  listMemories: listMemoriesSchema,
  listModels: listModelsSchema,
};
