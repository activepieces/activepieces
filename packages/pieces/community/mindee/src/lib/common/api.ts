import { HttpMethod } from '@activepieces/pieces-common';
import { encodeId, isRecord, mindeeV2Request } from './client';
import { mindeeFiles, MindeeUpload } from './file';
import { mindeeInference, MindeeProduct } from './inference';

async function listModels({
  apiKey,
  name,
  modelType,
  page,
  perPage,
}: {
  apiKey: string;
  name?: string;
  modelType?: MindeeProduct;
  page?: number;
  perPage?: number;
}): Promise<ModelsPage> {
  const response = await mindeeV2Request<unknown>({
    apiKey,
    method: HttpMethod.GET,
    path: '/v2/search/models',
    query: { name: name?.trim(), model_type: modelType, page, per_page: perPage },
  });
  const body = isRecord(response.body) ? response.body : {};
  const models = (Array.isArray(body['models']) ? body['models'] : []).filter(isRecord).map((model) => ({
    id: str(model['id']),
    name: str(model['name']),
    model_type: str(model['model_type']),
    webhooks: (Array.isArray(model['webhooks']) ? model['webhooks'] : []).filter(isRecord).map((webhook) => ({
      id: str(webhook['id']),
      name: str(webhook['name']),
      url: str(webhook['url']),
    })),
  }));
  return { models, ...pagination(body['pagination']) };
}

async function listAllModels({ apiKey, modelType }: { apiKey: string; modelType?: MindeeProduct }): Promise<ModelSummary[]> {
  const pages: ModelSummary[][] = [];
  for (let page = 1; page <= MAX_DROPDOWN_PAGES; page++) {
    const result = await listModels({ apiKey, modelType, page, perPage: DROPDOWN_PAGE_SIZE });
    pages.push(result.models);
    if (result.total_pages === null || page >= result.total_pages || result.models.length === 0) {
      break;
    }
  }
  return pages.flat();
}

async function uploadRagDocument({ apiKey, modelId, upload }: { apiKey: string; modelId: string | undefined; upload: MindeeUpload }): Promise<RagDocument> {
  const form = new FormData();
  form.append('model_id', mindeeInference.requireUuid({ value: modelId, label: 'Model' }));
  form.append('file', mindeeFiles.toBlob(upload), upload.filename);
  const response = await mindeeV2Request<unknown>({
    apiKey,
    method: HttpMethod.POST,
    path: '/v2/products/extraction/rag-documents',
    body: form,
    timeoutMs: 120_000,
  });
  return ragDocument(response.body);
}

async function getRagDocument({ apiKey, documentId }: { apiKey: string; documentId: string | undefined }): Promise<RagDocument> {
  const response = await mindeeV2Request<unknown>({
    apiKey,
    method: HttpMethod.GET,
    path: `/v2/products/extraction/rag-documents/${encodeId({ id: documentId, label: 'RAG Document ID' })}`,
  });
  return ragDocument(response.body);
}

async function updateRagDocument({
  apiKey,
  documentId,
  status,
  annotation,
}: {
  apiKey: string;
  documentId: string | undefined;
  status?: string;
  annotation?: Record<string, unknown>;
}): Promise<RagDocument> {
  if (status !== undefined && status !== 'Draft' && status !== 'Active') {
    throw new Error('Status must be Draft or Active.');
  }
  if (status === undefined && annotation === undefined) {
    throw new Error('Set a new status or an annotation to update the RAG document.');
  }
  const response = await mindeeV2Request<unknown>({
    apiKey,
    method: HttpMethod.PATCH,
    path: `/v2/products/extraction/rag-documents/${encodeId({ id: documentId, label: 'RAG Document ID' })}`,
    body: { ...(status === undefined ? {} : { status }), ...(annotation === undefined ? {} : { annotation }) },
  });
  return ragDocument(response.body);
}

async function deleteRagDocument({ apiKey, documentId }: { apiKey: string; documentId: string | undefined }): Promise<{ deleted: boolean; id: string }> {
  const id = encodeId({ id: documentId, label: 'RAG Document ID' });
  await mindeeV2Request<unknown>({ apiKey, method: HttpMethod.DELETE, path: `/v2/products/extraction/rag-documents/${id}` });
  return { deleted: true, id: decodeURIComponent(id) };
}

async function searchRagDocuments({
  apiKey,
  modelId,
  filename,
  page,
  perPage,
}: {
  apiKey: string;
  modelId: string | undefined;
  filename?: string;
  page?: number;
  perPage?: number;
}): Promise<RagSearchPage> {
  const response = await mindeeV2Request<unknown>({
    apiKey,
    method: HttpMethod.GET,
    path: '/v2/search/rag-documents',
    query: { model_id: mindeeInference.requireUuid({ value: modelId, label: 'Model' }), filename: filename?.trim(), page, per_page: perPage },
  });
  const body = isRecord(response.body) ? response.body : {};
  const documents = (Array.isArray(body['rag_documents']) ? body['rag_documents'] : []).filter(isRecord).map(ragSummary);
  return { rag_documents: documents, ...pagination(body['pagination']) };
}

function ragDocument(body: unknown): RagDocument {
  if (!isRecord(body) || typeof body['id'] !== 'string') {
    throw new Error('Mindee returned an unexpected RAG document response.');
  }
  return { ...ragSummary(body), annotation: isRecord(body['annotation']) ? body['annotation'] : null };
}

function ragSummary(body: Record<string, unknown>): RagSummary {
  return {
    id: str(body['id']),
    model_id: str(body['model_id']),
    filename: str(body['filename']),
    status: str(body['status']),
    created_at: str(body['created_at']),
    total_matches: typeof body['total_matches'] === 'number' ? body['total_matches'] : null,
    last_match_at: str(body['last_match_at']),
  };
}

function pagination(value: unknown): Pagination {
  const meta = isRecord(value) ? value : {};
  return {
    page: num(meta['page']),
    per_page: num(meta['per_page']),
    total_items: num(meta['total_items']),
    total_pages: num(meta['total_pages']),
  };
}

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

const DROPDOWN_PAGE_SIZE = 100;
const MAX_DROPDOWN_PAGES = 5;

export const mindeeApi = { listModels, listAllModels, uploadRagDocument, getRagDocument, updateRagDocument, deleteRagDocument, searchRagDocuments };

export type ModelSummary = {
  id: string | null;
  name: string | null;
  model_type: string | null;
  webhooks: { id: string | null; name: string | null; url: string | null }[];
};

type Pagination = { page: number | null; per_page: number | null; total_items: number | null; total_pages: number | null };

export type ModelsPage = { models: ModelSummary[] } & Pagination;

export type RagSummary = {
  id: string | null;
  model_id: string | null;
  filename: string | null;
  status: string | null;
  created_at: string | null;
  total_matches: number | null;
  last_match_at: string | null;
};

export type RagDocument = RagSummary & { annotation: Record<string, unknown> | null };

export type RagSearchPage = { rag_documents: RagSummary[] } & Pagination;
