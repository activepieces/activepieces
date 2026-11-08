import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { buildGoodMemApiError, GoodMemApiError } from './errors';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString({ source, key }: { source: unknown; key: string }): string | undefined {
  if (!isRecord(source)) {
    return undefined;
  }
  const value = source[key];
  return typeof value === 'string' ? value : undefined;
}

function readNumber({ source, key }: { source: unknown; key: string }): number | undefined {
  if (!isRecord(source)) {
    return undefined;
  }
  const value = source[key];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function readArray({ source, key }: { source: unknown; key: string }): unknown[] {
  if (Array.isArray(source)) {
    return source;
  }
  if (!isRecord(source)) {
    return [];
  }
  const value = source[key];
  return Array.isArray(value) ? value : [];
}

function readHttpFailure(error: unknown): { status: number; body: unknown } | null {
  if (!isRecord(error)) {
    return null;
  }
  const response = error['response'];
  if (!isRecord(response)) {
    return null;
  }
  const status = response['status'];
  if (typeof status !== 'number') {
    return null;
  }
  return { status, body: response['body'] };
}

function cleanBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

async function request({
  auth,
  method,
  path,
  action,
  query,
  body,
  accept = 'application/json',
  responseType = 'json',
}: GoodMemRequestParams): Promise<unknown> {
  const queryParams: Record<string, string> = {};
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') {
        queryParams[key] = String(value);
      }
    }
  }
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${cleanBaseUrl(auth.baseUrl)}${path}`,
      headers: {
        'X-API-Key': auth.apiKey,
        'Content-Type': 'application/json',
        Accept: accept,
      },
      queryParams,
      body,
      responseType,
      timeout: 120000,
    });
    return response.body;
  } catch (error) {
    const failure = readHttpFailure(error);
    if (failure) {
      throw buildGoodMemApiError({ status: failure.status, responseBody: failure.body, action });
    }
    const reason = readString({ source: error, key: 'message' }) ?? String(error);
    throw new GoodMemApiError({
      message: `Cannot reach the GoodMem server at ${cleanBaseUrl(auth.baseUrl)} (${action}): ${reason}`,
      status: 0,
      responseBody: null,
    });
  }
}

async function collectPages<T>({
  fetchPage,
  maxPages = 100,
}: {
  fetchPage: (nextToken: string | undefined) => Promise<{ items: T[]; nextToken?: string }>;
  maxPages?: number;
}): Promise<T[]> {
  const all: T[] = [];
  let token: string | undefined = undefined;
  for (let page = 0; page < maxPages; page++) {
    const result: { items: T[]; nextToken?: string } = await fetchPage(token);
    all.push(...result.items);
    if (!result.nextToken || result.nextToken === token) {
      return all;
    }
    token = result.nextToken;
  }
  return all;
}

function normalizeSpace(raw: unknown): GoodMemSpace {
  return {
    spaceId: readString({ source: raw, key: 'spaceId' }) ?? '',
    name: readString({ source: raw, key: 'name' }) ?? '',
    createTime: isRecord(raw) ? raw['createTime'] ?? null : null,
    spaceEmbedders: readArray({ source: raw, key: 'spaceEmbedders' }).map((entry) => ({
      embedderId: readString({ source: entry, key: 'embedderId' }) ?? '',
      defaultRetrievalWeight: readNumber({ source: entry, key: 'defaultRetrievalWeight' }) ?? null,
    })),
  };
}

async function listSpacesPage({
  auth,
  name,
  maxResults,
  nextToken,
}: {
  auth: GoodMemAuthConfig;
  name?: string;
  maxResults: number;
  nextToken?: string;
}): Promise<{ spaces: GoodMemSpace[]; nextToken?: string }> {
  const body = await request({
    auth,
    method: HttpMethod.GET,
    path: '/v1/spaces',
    action: 'list spaces',
    query: { maxResults, nextToken, nameFilter: name },
  });
  return {
    spaces: readArray({ source: body, key: 'spaces' }).map(normalizeSpace),
    nextToken: readString({ source: body, key: 'nextToken' }) || undefined,
  };
}

async function listAllSpaces({ auth, name }: { auth: GoodMemAuthConfig; name?: string }): Promise<GoodMemSpace[]> {
  return collectPages({
    fetchPage: async (nextToken) => {
      const page = await listSpacesPage({ auth, name, maxResults: 1000, nextToken });
      return { items: page.spaces, nextToken: page.nextToken };
    },
  });
}

async function listModels({ auth, kind }: { auth: GoodMemAuthConfig; kind: 'embedders' | 'rerankers' | 'llms' }): Promise<unknown[]> {
  const body = await request({
    auth,
    method: HttpMethod.GET,
    path: `/v1/${kind}`,
    action: `list ${kind}`,
  });
  return readArray({ source: body, key: kind });
}

function normalizeEmbedder(raw: unknown): GoodMemEmbedder {
  return {
    embedderId: readString({ source: raw, key: 'embedderId' }) ?? '',
    displayName: readString({ source: raw, key: 'displayName' }) ?? '',
    modelIdentifier: readString({ source: raw, key: 'modelIdentifier' }) ?? '',
  };
}

function normalizeReranker(raw: unknown): GoodMemReranker {
  return {
    rerankerId: readString({ source: raw, key: 'rerankerId' }) ?? '',
    displayName: readString({ source: raw, key: 'displayName' }) ?? '',
    modelIdentifier: readString({ source: raw, key: 'modelIdentifier' }) ?? '',
  };
}

function normalizeLlm(raw: unknown): GoodMemLlm {
  return {
    llmId: readString({ source: raw, key: 'llmId' }) ?? '',
    displayName: readString({ source: raw, key: 'displayName' }) ?? '',
    modelIdentifier: readString({ source: raw, key: 'modelIdentifier' }) ?? '',
  };
}

function memoryPath(memoryId: string): string {
  return `/v1/memories/${encodeURIComponent(memoryId.trim())}`;
}

function requireText({ value, label }: { value: string | undefined | null; label: string }): string {
  const trimmed = (value ?? '').trim();
  if (trimmed.length === 0) {
    throw new Error(`${label} is required`);
  }
  return trimmed;
}

function buildChunkingConfig({
  chunkSize,
  chunkOverlap,
  keepStrategy,
  lengthMeasurement,
}: {
  chunkSize?: number;
  chunkOverlap?: number;
  keepStrategy?: string;
  lengthMeasurement?: string;
}): GoodMemChunkingConfig {
  const size = chunkSize ?? 256;
  const overlap = chunkOverlap ?? 25;
  if (!Number.isInteger(size) || size < 1) {
    throw new Error('Chunk Size must be a whole number of at least 1');
  }
  if (!Number.isInteger(overlap) || overlap < 0) {
    throw new Error('Chunk Overlap must be a whole number of 0 or more');
  }
  if (overlap >= size) {
    throw new Error('Chunk Overlap must be smaller than Chunk Size');
  }
  return {
    recursive: {
      chunkSize: size,
      chunkOverlap: overlap,
      separators: ['\n\n', '\n', '. ', ' ', ''],
      keepStrategy: keepStrategy || 'KEEP_END',
      separatorIsRegex: false,
      lengthMeasurement: lengthMeasurement || 'CHARACTER_COUNT',
    },
  };
}

function buildSpaceRequestBody({
  name,
  embedderId,
  chunkingConfig,
}: {
  name: string;
  embedderId: string;
  chunkingConfig: GoodMemChunkingConfig;
}): Record<string, unknown> {
  return {
    name,
    spaceEmbedders: [{ embedderId, defaultRetrievalWeight: 1.0 }],
    defaultChunkingConfig: chunkingConfig,
  };
}

async function createOrReuseSpace({
  auth,
  name,
  embedderId,
  chunkingConfig,
}: {
  auth: GoodMemAuthConfig;
  name: string;
  embedderId: string;
  chunkingConfig: GoodMemChunkingConfig;
}): Promise<GoodMemSpaceResult> {
  const existing = (await listAllSpaces({ auth, name })).find((space) => space.name === name);
  if (existing) {
    return {
      success: true,
      spaceId: existing.spaceId,
      name: existing.name,
      embedderId: existing.spaceEmbedders[0]?.embedderId || embedderId,
      chunkingConfig: null,
      message: 'Space already exists, reusing existing space',
      reused: true,
    };
  }
  const created = await request({
    auth,
    method: HttpMethod.POST,
    path: '/v1/spaces',
    action: 'create space',
    body: buildSpaceRequestBody({ name, embedderId, chunkingConfig }),
  });
  return {
    success: true,
    spaceId: readString({ source: created, key: 'spaceId' }) ?? '',
    name: readString({ source: created, key: 'name' }) ?? name,
    embedderId,
    chunkingConfig,
    message: 'Space created successfully',
    reused: false,
  };
}

function parseTags(tags: unknown): string[] {
  const parts: unknown[] = Array.isArray(tags)
    ? tags
    : typeof tags === 'string'
      ? tags.split(',')
      : [];
  const result: string[] = [];
  for (const part of parts) {
    if (typeof part === 'string' || typeof part === 'number') {
      const trimmed = String(part).trim();
      if (trimmed.length > 0) {
        result.push(trimmed);
      }
    }
  }
  return result;
}

function buildMemoryMetadata({
  source,
  author,
  tags,
  metadata,
}: {
  source?: string;
  author?: string;
  tags?: unknown;
  metadata?: unknown;
}): Record<string, unknown> | undefined {
  const merged: Record<string, unknown> = {};
  let extra: unknown = metadata;
  if (typeof extra === 'string' && extra.trim().length > 0) {
    try {
      extra = JSON.parse(extra);
    } catch {
      throw new Error('Additional Metadata must be a JSON object');
    }
  }
  if (extra !== undefined && extra !== null && extra !== '') {
    if (!isRecord(extra)) {
      throw new Error('Additional Metadata must be a JSON object');
    }
    for (const [key, value] of Object.entries(extra)) {
      merged[key] = value;
    }
  }
  if (source && source.trim()) {
    merged['source'] = source.trim();
  }
  if (author && author.trim()) {
    merged['author'] = author.trim();
  }
  const tagList = parseTags(tags);
  if (tagList.length > 0) {
    merged['tags'] = tagList;
  }
  return Object.keys(merged).length > 0 ? merged : undefined;
}

function buildMemoryRequestBody({
  spaceId,
  file,
  textContent,
  metadata,
}: {
  spaceId: string;
  file?: { base64?: string; extension?: string; filename?: string } | null;
  textContent?: string;
  metadata?: Record<string, unknown>;
}): Record<string, unknown> {
  const body: Record<string, unknown> = { spaceId };
  if (file && typeof file.base64 === 'string' && file.base64.length > 0) {
    const extension = file.extension || extensionFromName(file.filename);
    const mimeType = (extension ? getMimeType(extension) : null) ?? 'application/octet-stream';
    body['contentType'] = mimeType;
    if (mimeType.startsWith('text/')) {
      body['originalContent'] = Buffer.from(file.base64, 'base64').toString('utf-8');
    } else {
      body['originalContentB64'] = file.base64;
    }
  } else if (textContent && textContent.trim().length > 0) {
    body['contentType'] = 'text/plain';
    body['originalContent'] = textContent;
  } else {
    throw new Error('No content provided. Provide a file or text content');
  }
  if (metadata) {
    body['metadata'] = metadata;
  }
  return body;
}

function extensionFromName(filename: string | undefined): string | undefined {
  if (!filename || !filename.includes('.')) {
    return undefined;
  }
  return filename.split('.').pop();
}

function getMimeType(extension: string): string | null {
  return MIME_TYPES[extension.toLowerCase().replace('.', '')] ?? null;
}

async function createMemoryRequest({
  auth,
  body,
}: {
  auth: GoodMemAuthConfig;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return request({
    auth,
    method: HttpMethod.POST,
    path: '/v1/memories',
    action: 'create memory',
    body,
  });
}

function buildRetrieveRequestBody({
  query,
  spaceIds,
  maxResults,
  fetchMemory,
  rerankerId,
  llmId,
  relevanceThreshold,
  llmTemperature,
  chronologicalResort,
}: GoodMemRetrieveParams): Record<string, unknown> {
  const spaceKeys = spaceIds
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
    .map((spaceId) => ({ spaceId }));
  if (spaceKeys.length === 0) {
    throw new Error('At least one space must be selected');
  }
  if (query.trim().length === 0) {
    throw new Error('Query is required');
  }
  const requestedSize = maxResults ?? 5;
  if (!Number.isInteger(requestedSize) || requestedSize < 1) {
    throw new Error('Maximum Results must be a whole number of at least 1');
  }
  const body: Record<string, unknown> = {
    message: query,
    spaceKeys,
    requestedSize,
    fetchMemory,
  };
  if (rerankerId || llmId) {
    const config: Record<string, unknown> = {};
    if (rerankerId) {
      config['reranker_id'] = rerankerId;
    }
    if (llmId) {
      config['llm_id'] = llmId;
    }
    if (relevanceThreshold !== undefined && relevanceThreshold !== null) {
      config['relevance_threshold'] = relevanceThreshold;
    }
    if (llmTemperature !== undefined && llmTemperature !== null) {
      config['llm_temp'] = llmTemperature;
    }
    config['max_results'] = requestedSize;
    if (chronologicalResort) {
      config['chronological_resort'] = true;
    }
    body['postProcessor'] = {
      name: 'com.goodmem.retrieval.postprocess.ChatPostProcessorFactory',
      config,
    };
  }
  return body;
}

function parseRetrieveStream(raw: unknown): GoodMemRetrieveParsed {
  const items: unknown[] = [];
  if (Array.isArray(raw)) {
    items.push(...raw);
  } else if (isRecord(raw)) {
    items.push(raw);
  } else if (typeof raw === 'string') {
    for (const line of raw.split('\n')) {
      let text = line.trim();
      if (text.length === 0 || text.startsWith(':') || text.startsWith('event:') || text.startsWith('id:') || text.startsWith('retry:')) {
        continue;
      }
      if (text.startsWith('data:')) {
        text = text.slice(5).trim();
      }
      if (text.length === 0 || text === '[DONE]') {
        continue;
      }
      try {
        items.push(JSON.parse(text));
      } catch {
        throw new GoodMemApiError({
          message: 'GoodMem retrieve returned a line that is not valid JSON',
          status: 200,
          responseBody: text.slice(0, 500),
        });
      }
    }
  }
  const parsed: GoodMemRetrieveParsed = { resultSetId: '', results: [], memories: [], abstractReply: null };
  for (const item of items) {
    if (!isRecord(item)) {
      continue;
    }
    const boundary = item['resultSetBoundary'];
    const retrieved = item['retrievedItem'];
    if (isRecord(boundary)) {
      parsed.resultSetId = readString({ source: boundary, key: 'resultSetId' }) ?? parsed.resultSetId;
    } else if (item['memoryDefinition'] !== undefined) {
      parsed.memories.push(item['memoryDefinition']);
    } else if (item['abstractReply'] !== undefined) {
      parsed.abstractReply = item['abstractReply'];
    } else if (isRecord(retrieved)) {
      const chunkWrapper = retrieved['chunk'];
      const chunk = isRecord(chunkWrapper) && isRecord(chunkWrapper['chunk']) ? chunkWrapper['chunk'] : chunkWrapper;
      parsed.results.push({
        chunkId: readString({ source: chunk, key: 'chunkId' }) ?? null,
        chunkText: readString({ source: chunk, key: 'chunkText' }) ?? null,
        memoryId: readString({ source: chunk, key: 'memoryId' }) ?? null,
        relevanceScore: readNumber({ source: retrieved, key: 'relevanceScore' }) ?? readNumber({ source: chunkWrapper, key: 'relevanceScore' }) ?? null,
        memoryIndex: readNumber({ source: retrieved, key: 'memoryIndex' }) ?? readNumber({ source: chunkWrapper, key: 'memoryIndex' }) ?? null,
      });
    }
  }
  return parsed;
}

async function retrieveMemoriesRequest({
  auth,
  params,
  waitForIndexing,
}: {
  auth: GoodMemAuthConfig;
  params: GoodMemRetrieveParams;
  waitForIndexing: boolean;
}): Promise<GoodMemRetrieveOutput> {
  const body = buildRetrieveRequestBody(params);
  const maxWaitMs = 60000;
  const pollIntervalMs = 5000;
  const startTime = Date.now();
  for (;;) {
    const raw = await request({
      auth,
      method: HttpMethod.POST,
      path: '/v1/memories:retrieve',
      action: 'retrieve memories',
      body,
      accept: 'application/x-ndjson',
      responseType: 'text',
    });
    const parsed = parseRetrieveStream(raw);
    const output: GoodMemRetrieveOutput = {
      success: true,
      resultSetId: parsed.resultSetId,
      results: parsed.results,
      memories: parsed.memories,
      totalResults: parsed.results.length,
      query: params.query,
    };
    if (parsed.abstractReply !== null) {
      output.abstractReply = parsed.abstractReply;
    }
    if (parsed.results.length > 0 || !waitForIndexing) {
      return output;
    }
    if (Date.now() - startTime >= maxWaitMs) {
      output.message = 'No results found after waiting 60 seconds for indexing. Memories may still be processing';
      return output;
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
}

async function listMemoriesPage({
  auth,
  spaceId,
  filter,
  maxResults,
  nextToken,
}: {
  auth: GoodMemAuthConfig;
  spaceId: string;
  filter?: string;
  maxResults?: number;
  nextToken?: string;
}): Promise<{ memories: unknown[]; nextToken: string | null }> {
  const body = await request({
    auth,
    method: HttpMethod.GET,
    path: `/v1/spaces/${encodeURIComponent(spaceId.trim())}/memories`,
    action: 'list memories',
    query: { maxResults, nextToken, filter },
  });
  return {
    memories: readArray({ source: body, key: 'memories' }),
    nextToken: readString({ source: body, key: 'nextToken' }) || null,
  };
}

export const goodmemApi = {
  request,
  collectPages,
  listSpacesPage,
  listAllSpaces,
  listModels,
  listMemoriesPage,
  createOrReuseSpace,
  createMemoryRequest,
  retrieveMemoriesRequest,
  memoryPath,
};

export const goodmemParsers = {
  isRecord,
  readString,
  readNumber,
  normalizeSpace,
  normalizeEmbedder,
  normalizeReranker,
  normalizeLlm,
  parseRetrieveStream,
};

export const goodmemBuilders = {
  requireText,
  buildChunkingConfig,
  buildSpaceRequestBody,
  buildMemoryMetadata,
  buildMemoryRequestBody,
  buildRetrieveRequestBody,
  parseTags,
};

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  txt: 'text/plain',
  html: 'text/html',
  md: 'text/markdown',
  csv: 'text/csv',
  json: 'application/json',
  xml: 'application/xml',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

export type GoodMemAuthConfig = {
  baseUrl: string;
  apiKey: string;
};

export type GoodMemRequestParams = {
  auth: GoodMemAuthConfig;
  method: HttpMethod;
  path: string;
  action: string;
  query?: Record<string, string | number | undefined>;
  body?: Record<string, unknown>;
  accept?: string;
  responseType?: 'json' | 'text';
};

export type GoodMemSpace = {
  spaceId: string;
  name: string;
  createTime: unknown;
  spaceEmbedders: { embedderId: string; defaultRetrievalWeight: number | null }[];
};

export type GoodMemEmbedder = { embedderId: string; displayName: string; modelIdentifier: string };
export type GoodMemReranker = { rerankerId: string; displayName: string; modelIdentifier: string };
export type GoodMemLlm = { llmId: string; displayName: string; modelIdentifier: string };

export type GoodMemChunkingConfig = {
  recursive: {
    chunkSize: number;
    chunkOverlap: number;
    separators: string[];
    keepStrategy: string;
    separatorIsRegex: boolean;
    lengthMeasurement: string;
  };
};

export type GoodMemSpaceResult = {
  success: boolean;
  spaceId: string;
  name: string;
  embedderId: string;
  chunkingConfig: GoodMemChunkingConfig | null;
  message: string;
  reused: boolean;
};

export type GoodMemRetrieveParams = {
  query: string;
  spaceIds: string[];
  maxResults?: number;
  fetchMemory: boolean;
  rerankerId?: string;
  llmId?: string;
  relevanceThreshold?: number;
  llmTemperature?: number;
  chronologicalResort?: boolean;
};

export type GoodMemRetrievedChunk = {
  chunkId: string | null;
  chunkText: string | null;
  memoryId: string | null;
  relevanceScore: number | null;
  memoryIndex: number | null;
};

export type GoodMemRetrieveParsed = {
  resultSetId: string;
  results: GoodMemRetrievedChunk[];
  memories: unknown[];
  abstractReply: unknown;
};

export type GoodMemRetrieveOutput = {
  success: boolean;
  resultSetId: string;
  results: GoodMemRetrievedChunk[];
  memories: unknown[];
  totalResults: number;
  query: string;
  abstractReply?: unknown;
  message?: string;
};
