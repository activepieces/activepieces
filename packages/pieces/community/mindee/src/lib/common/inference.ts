import { HttpMethod } from '@activepieces/pieces-common';
import { encodeId, isRecord, MindeeApiError, mindeeV2Request, v2PathFromUrl, vendorDetail } from './client';
import { mindeeFiles, MindeeUpload } from './file';

async function runInference({
  apiKey,
  product,
  modelId,
  source,
  options,
  maxWaitMs = MAX_WAIT_MS,
}: {
  apiKey: string;
  product: MindeeProduct;
  modelId: string | undefined;
  source: InferenceSource;
  options: InferenceOptions;
  maxWaitMs?: number;
}): Promise<InferenceOutput> {
  const startedAt = Date.now();
  const job = await enqueue({ apiKey, product, modelId, source, options });
  const finalJob = await waitForJob({ apiKey, job, deadline: startedAt + maxWaitMs });
  if (finalJob.status !== 'Processed') {
    return pendingOutput({ product, job: finalJob, waitedSeconds: Math.round((Date.now() - startedAt) / 1000) });
  }
  return fetchResultForJob({ apiKey, product, job: finalJob });
}

async function enqueue({
  apiKey,
  product,
  modelId,
  source,
  options,
}: {
  apiKey: string;
  product: MindeeProduct;
  modelId: string | undefined;
  source: InferenceSource;
  options: InferenceOptions;
}): Promise<MindeeJob> {
  const form = new FormData();
  form.append('model_id', requireUuid({ value: modelId, label: 'Model' }));
  if (source.type === 'url') {
    form.append('url', mindeeFiles.parseHttpsUrl({ value: source.url, label: 'File URL' }).toString());
  } else {
    form.append('file', mindeeFiles.toBlob(source.upload), source.upload.filename);
  }
  const fields = enqueueFields({ product, options });
  for (const [key, value] of fields) {
    form.append(key, value);
  }
  const response = await mindeeV2Request<unknown>({
    apiKey,
    method: HttpMethod.POST,
    path: `/v2/products/${product}/enqueue`,
    body: form,
    timeoutMs: ENQUEUE_TIMEOUT_MS,
  });
  return parseJob(response.body);
}

async function getJob({ apiKey, jobId }: { apiKey: string; jobId: string | undefined }): Promise<MindeeJob> {
  const response = await mindeeV2Request<unknown>({
    apiKey,
    method: HttpMethod.GET,
    path: `/v2/jobs/${encodeId({ id: jobId, label: 'Job ID' })}`,
    query: { redirect: false },
  });
  return parseJob(response.body);
}

async function getResult({
  apiKey,
  product,
  inferenceId,
}: {
  apiKey: string;
  product: MindeeProduct;
  inferenceId: string | undefined;
}): Promise<InferenceOutput> {
  const response = await mindeeV2Request<unknown>({
    apiKey,
    method: HttpMethod.GET,
    path: `/v2/products/${product}/results/${encodeId({ id: inferenceId, label: 'Inference ID' })}`,
  });
  return normalizeInference({ product, body: response.body, job: null });
}

async function waitForJob({ apiKey, job, deadline }: { apiKey: string; job: MindeeJob; deadline: number }): Promise<MindeeJob> {
  let current = job;
  let attempt = 0;
  while (current.status === 'Processing') {
    const delay = pollDelay(attempt);
    if (Date.now() + delay > deadline) {
      return current;
    }
    await sleep(delay);
    attempt += 1;
    try {
      current = await getJob({ apiKey, jobId: current.id });
    } catch (error) {
      if (error instanceof MindeeApiError && error.status === 429) {
        continue;
      }
      throw error;
    }
  }
  if (current.status === 'Failed') {
    const detail = vendorDetail(current.error) ?? 'no reason given';
    throw new Error(`Mindee could not process the document (job ${current.id}): ${detail}`);
  }
  return current;
}

async function fetchResultForJob({ apiKey, product, job }: { apiKey: string; product: MindeeProduct; job: MindeeJob }): Promise<InferenceOutput> {
  const path = job.result_url !== null ? v2PathFromUrl(job.result_url) : null;
  if (path === null) {
    throw new Error(`Mindee marked job ${job.id} as processed but did not return a result URL. Use Get Job Status to check it again.`);
  }
  const response = await mindeeV2Request<unknown>({ apiKey, method: HttpMethod.GET, path });
  return normalizeInference({ product, body: response.body, job });
}

function enqueueFields({ product, options }: { product: MindeeProduct; options: InferenceOptions }): Array<[string, string]> {
  const fields: Array<[string, string]> = [];
  const alias = options.alias?.trim();
  if (alias !== undefined && alias.length > 0) {
    fields.push(['alias', alias]);
  }
  if (product !== 'extraction') {
    return fields;
  }
  if (options.rag === true) {
    fields.push(['rag', 'true']);
  }
  if (options.rawText === true) {
    fields.push(['raw_text', 'true']);
  }
  if (options.confidence === true) {
    fields.push(['confidence', 'true']);
  }
  const context = options.textContext?.trim();
  if (context !== undefined && context.length > 0) {
    fields.push(['text_context', context]);
  }
  return fields;
}

function parseJob(body: unknown): MindeeJob {
  const job = isRecord(body) && isRecord(body['job']) ? body['job'] : undefined;
  if (job === undefined || typeof job['id'] !== 'string') {
    throw new Error('Mindee returned an unexpected job response.');
  }
  const status = job['status'];
  return {
    id: job['id'],
    status: status === 'Processed' || status === 'Failed' ? status : 'Processing',
    model_id: str(job['model_id']),
    filename: str(job['filename']),
    alias: str(job['alias']),
    created_at: str(job['created_at']),
    completed_at: str(job['completed_at']),
    polling_url: str(job['polling_url']),
    result_url: str(job['result_url']),
    error: isRecord(job['error']) ? job['error'] : null,
  };
}

function jobSummary(job: MindeeJob): JobSummary {
  const resultPath = job.result_url === null ? null : safeResultPath(job.result_url);
  const match = resultPath === null ? null : RESULT_PATH.exec(resultPath);
  return {
    job_id: job.id,
    status: job.status,
    completed: job.status !== 'Processing',
    model_id: job.model_id,
    filename: job.filename,
    alias: job.alias,
    created_at: job.created_at,
    completed_at: job.completed_at,
    product: match === null ? null : match[1],
    inference_id: match === null ? null : decodeURIComponent(match[2]),
    error: job.error === null ? null : vendorDetail(job.error) ?? 'Processing failed.',
  };
}

function safeResultPath(url: string): string | null {
  try {
    return v2PathFromUrl(url);
  } catch {
    return null;
  }
}

function pendingOutput({ product, job, waitedSeconds }: { product: MindeeProduct; job: MindeeJob; waitedSeconds: number }): InferenceOutput {
  return {
    completed: false,
    status: job.status,
    message: `Mindee is still processing the document after ${waitedSeconds} seconds. Use Get Job Status with job ID ${job.id}, then Get Result, to collect it later.`,
    product,
    job_id: job.id,
    inference_id: null,
    model_id: job.model_id,
    alias: job.alias,
    file: { name: job.filename, page_count: null, mime_type: null },
    ...emptyProductFields(product),
  };
}

function normalizeInference({ product, body, job }: { product: MindeeProduct; body: unknown; job: MindeeJob | null }): InferenceOutput {
  const inference = isRecord(body) && isRecord(body['inference']) ? body['inference'] : undefined;
  if (inference === undefined) {
    throw new Error('Mindee returned an unexpected result response.');
  }
  const file = isRecord(inference['file']) ? inference['file'] : {};
  const model = isRecord(inference['model']) ? inference['model'] : {};
  const inferenceJob = isRecord(inference['job']) ? inference['job'] : {};
  const result = isRecord(inference['result']) ? inference['result'] : {};
  return {
    completed: true,
    status: 'Processed',
    message: null,
    product,
    job_id: job?.id ?? str(inferenceJob['id']),
    inference_id: str(inference['id']),
    model_id: str(model['id']) ?? job?.model_id ?? null,
    alias: str(file['alias']) ?? job?.alias ?? null,
    file: {
      name: str(file['name']) ?? job?.filename ?? null,
      page_count: typeof file['page_count'] === 'number' ? file['page_count'] : null,
      mime_type: str(file['mime_type']),
    },
    ...productFields({ product, result }),
  };
}

function productFields({ product, result }: { product: MindeeProduct; result: Record<string, unknown> }): ProductFields {
  switch (product) {
    case 'extraction':
      return extractionFields(result);
    case 'classification': {
      const classification = isRecord(result['classification']) ? result['classification'] : {};
      return { document_type: str(classification['document_type']), fields: nestedExtraction(classification['extraction_response']) };
    }
    case 'crop':
      return {
        crops: arrayOfRecords(result['crops']).map((crop) => {
          const location = isRecord(crop['location']) ? crop['location'] : {};
          return {
            object_type: str(crop['object_type']),
            page: typeof location['page'] === 'number' ? location['page'] : null,
            polygon: Array.isArray(location['polygon']) ? location['polygon'] : [],
            fields: nestedExtraction(crop['extraction_response']),
          };
        }),
      };
    case 'ocr': {
      const pages = arrayOfRecords(result['pages']).map((page, index) => ({
        page: index,
        content: str(page['content']) ?? '',
        word_count: Array.isArray(page['words']) ? page['words'].length : 0,
      }));
      return { text: pages.map((page) => page.content).join('\n\n'), pages };
    }
    case 'split':
      return {
        splits: arrayOfRecords(result['splits']).map((split) => {
          const range = Array.isArray(split['page_range']) ? split['page_range'] : [];
          const start = typeof range[0] === 'number' ? range[0] : null;
          const end = typeof range[1] === 'number' ? range[1] : null;
          return {
            document_type: str(split['document_type']),
            start_page: start,
            end_page: end,
            page_count: start !== null && end !== null ? end - start + 1 : null,
            fields: nestedExtraction(split['extraction_response']),
          };
        }),
      };
  }
}

function extractionFields(result: Record<string, unknown>): ProductFields {
  const rawFields = isRecord(result['fields']) ? result['fields'] : {};
  const rawText = isRecord(result['raw_text']) ? arrayOfRecords(result['raw_text']['pages']) : null;
  const rag = isRecord(result['rag']) ? result['rag'] : null;
  return {
    fields: simplifyFields(rawFields),
    field_confidence: confidenceMap(rawFields),
    raw_text: rawText === null ? null : rawText.map((page) => str(page['content']) ?? '').join('\n\n'),
    rag_document_id: rag === null ? null : str(rag['retrieved_document_id']),
  };
}

function nestedExtraction(value: unknown): Record<string, unknown> {
  if (!isRecord(value) || !isRecord(value['inference'])) {
    return {};
  }
  const result = value['inference']['result'];
  return isRecord(result) && isRecord(result['fields']) ? simplifyFields(result['fields']) : {};
}

function simplifyFields(fields: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([name, field]) => [name, simplifyField(field)]));
}

function simplifyField(field: unknown): unknown {
  if (!isRecord(field)) {
    return field ?? null;
  }
  if ('value' in field) {
    return field['value'] ?? null;
  }
  if (isRecord(field['fields'])) {
    return simplifyFields(field['fields']);
  }
  if (Array.isArray(field['items'])) {
    return field['items'].map(simplifyField);
  }
  return null;
}

function confidenceMap(fields: Record<string, unknown>): Record<string, string | null> {
  return Object.fromEntries(
    Object.entries(fields).map(([name, field]) => [name, isRecord(field) && typeof field['confidence'] === 'string' ? field['confidence'] : null]),
  );
}

function emptyProductFields(product: MindeeProduct): ProductFields {
  switch (product) {
    case 'extraction':
      return { fields: {}, field_confidence: {}, raw_text: null, rag_document_id: null };
    case 'classification':
      return { document_type: null, fields: {} };
    case 'crop':
      return { crops: [] };
    case 'ocr':
      return { text: null, pages: [] };
    case 'split':
      return { splits: [] };
  }
}

function requireUuid({ value, label }: { value: string | undefined; label: string }): string {
  const trimmed = (value ?? '').trim();
  if (!UUID.test(trimmed)) {
    throw new Error(`${label} must be a Mindee model ID (a UUID such as 4f3d1c2e-...). Use List Models to find it.`);
  }
  return trimmed;
}

function arrayOfRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function pollDelay(attempt: number): number {
  return attempt === 0 ? FIRST_POLL_MS : Math.min(Math.round(POLL_MS * 1.25 ** attempt), MAX_POLL_MS);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RESULT_PATH = /^\/v2\/products\/(extraction|classification|crop|ocr|split)\/results\/([^/]+)$/;
const MAX_WAIT_MS = 240_000;
const ENQUEUE_TIMEOUT_MS = 120_000;
const FIRST_POLL_MS = 2_000;
const POLL_MS = 1_500;
const MAX_POLL_MS = 6_000;

export const MINDEE_PRODUCTS: MindeeProduct[] = ['extraction', 'classification', 'crop', 'ocr', 'split'];

export const mindeeInference = { runInference, getJob, getResult, jobSummary, normalizeInference, simplifyFields, requireUuid, pollDelay };

export type MindeeProduct = 'extraction' | 'classification' | 'crop' | 'ocr' | 'split';

export type InferenceSource = { type: 'url'; url: string | undefined } | { type: 'upload'; upload: MindeeUpload };

export type InferenceOptions = {
  alias?: string;
  rag?: boolean;
  rawText?: boolean;
  confidence?: boolean;
  textContext?: string;
};

export type MindeeJob = {
  id: string;
  status: 'Processing' | 'Processed' | 'Failed';
  model_id: string | null;
  filename: string | null;
  alias: string | null;
  created_at: string | null;
  completed_at: string | null;
  polling_url: string | null;
  result_url: string | null;
  error: Record<string, unknown> | null;
};

export type JobSummary = {
  job_id: string;
  status: MindeeJob['status'];
  completed: boolean;
  model_id: string | null;
  filename: string | null;
  alias: string | null;
  created_at: string | null;
  completed_at: string | null;
  product: string | null;
  inference_id: string | null;
  error: string | null;
};

type ProductFields = Record<string, unknown>;

export type InferenceOutput = {
  completed: boolean;
  status: MindeeJob['status'];
  message: string | null;
  product: MindeeProduct;
  job_id: string | null;
  inference_id: string | null;
  model_id: string | null;
  alias: string | null;
  file: { name: string | null; page_count: number | null; mime_type: string | null };
} & ProductFields;
