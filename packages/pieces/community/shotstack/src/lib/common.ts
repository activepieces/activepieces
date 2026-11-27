import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { Property, tryCatch } from '@activepieces/pieces-framework';

function baseUrl(environment?: string): string {
  return `https://api.shotstack.io/edit/${environment === 'stage' ? 'stage' : 'v1'}`;
}

function headers(apiKey: string): Record<string, string> {
  return {
    'x-api-key': apiKey,
    'x-shotstack-origin': 'activepieces',
    'User-Agent': `shotstack-activepieces/${VERSION}`,
  };
}

async function send<T>({ connection, method, path, body }: RequestParams): Promise<{ status: number; body: T }> {
  const { data, error } = await tryCatch(() =>
    httpClient.sendRequest<T>({
      method,
      url: baseUrl(connection.environment) + path,
      headers: headers(connection.api_key),
      body,
    }),
  );
  if (error instanceof HttpError) {
    throw new ShotstackError({
      message: `Shotstack ${error.response.status}: ${errorText(error.response.body)}`,
      status: error.response.status,
    });
  }
  if (error) {
    throw error;
  }
  return { status: data.status, body: data.body };
}

async function request<T>(params: RequestParams): Promise<T> {
  const { body } = await send<{ response: T }>(params);
  return body.response;
}

function errorText(body: unknown): string {
  if (typeof body === 'string') {
    return body.slice(0, 200) || NO_DETAILS;
  }
  if (!isRecord(body)) {
    return NO_DETAILS;
  }
  const response = body['response'];
  if (typeof response === 'string' && response) {
    return response;
  }
  if (isRecord(response)) {
    const error = response['error'];
    const found = [
      ...messages({ list: response['errors'], keys: ['message'] }),
      ...messages({ list: isRecord(error) ? error['details'] : [], keys: ['message'] }),
    ];
    if (found.length > 0) {
      return found.join('; ');
    }
    if (response['message']) {
      return String(response['message']);
    }
  }
  const found = messages({ list: body['errors'], keys: ['detail', 'message'] });
  if (found.length > 0) {
    return found.join('; ');
  }
  return String(body['message'] ?? body['error'] ?? NO_DETAILS);
}

function parseObject({ value, label }: { value: unknown; label: string }): Record<string, unknown> {
  try {
    const parsed: unknown = typeof value === 'string' ? JSON.parse(value) : value;
    if (isRecord(parsed)) {
      return parsed;
    }
  } catch (e) {
    throw new ShotstackError({ message: `${label} is not valid JSON: ${e instanceof Error ? e.message : String(e)}` });
  }
  throw new ShotstackError({ message: `${label} must be a JSON object.` });
}

function getRender({ connection, id }: { connection: ShotstackConnection; id: string }): Promise<Render> {
  return request<Render>({ connection, method: HttpMethod.GET, path: `/render/${encodeURIComponent(id)}?data=false` });
}

async function waitForRender({
  connection,
  id,
  pollMs = POLL_MS,
  maxWaitMs = MAX_WAIT_MS,
}: WaitParams): Promise<RenderSummary> {
  const render = await pollJob({
    check: async () => {
      const job = await getRender({ connection, id });
      return { job, done: job.status === 'done' };
    },
    label: `Render ${id}`,
    advice: 'Check it later with Get Render Status rather than running a render step again, which starts and bills a new render.',
    pollMs,
    maxWaitMs,
  });
  return summary(render);
}

async function startRender({
  connection,
  path,
  body,
  wait,
}: {
  connection: ShotstackConnection;
  path: string;
  body: Record<string, unknown>;
  wait?: boolean;
}): Promise<RenderSummary> {
  const queued = await request<{ id?: string }>({ connection, method: HttpMethod.POST, path, body });
  if (!queued?.id) {
    throw new ShotstackError({ message: 'Shotstack did not return a render ID.' });
  }
  if (wait === false) {
    return summary({ id: queued.id, status: 'queued' });
  }
  return waitForRender({ connection, id: queued.id });
}

function summary(render: Render): RenderSummary {
  return {
    id: render.id,
    status: render.status,
    url: render.url ?? null,
    poster: render.poster ?? null,
    thumbnail: render.thumbnail ?? null,
    duration: render.duration ?? null,
    error: render.error ?? null,
  };
}

async function getTemplateMerge({ connection, id }: { connection: ShotstackConnection; id: string }): Promise<MergeField[]> {
  const { template } = await request<{ template?: { merge?: MergeField[] } }>({
    connection,
    method: HttpMethod.GET,
    path: `/templates/${encodeURIComponent(id)}`,
  });
  const merge = template?.merge;
  return (Array.isArray(merge) ? merge : []).filter((field) => typeof field?.find === 'string' && field.find !== '');
}

function mergeList({ templateMerge, sources }: { templateMerge: MergeField[]; sources: Record<string, unknown>[] }): MergeField[] {
  const values: Record<string, unknown> = Object.fromEntries(
    sources.flatMap((source) => Object.entries(source)).filter(([, value]) => !isBlank(value)),
  );
  const known = new Set(templateMerge.map((field) => field.find));
  return [
    ...templateMerge.map(({ find, replace }) => ({
      find,
      replace: find in values ? likeTemplate({ value: values[find], templateValue: replace }) : replace,
    })),
    ...Object.entries(values)
      .filter(([find]) => !known.has(find))
      .map(([find, replace]) => ({ find, replace })),
  ];
}

function customCallHeaders({ apiKey, url }: { apiKey: string; url: unknown }): Record<string, string> {
  const toShotstack =
    typeof url === 'string' && (!/^https?:\/\//i.test(url) || /^https:\/\/api\.shotstack\.io(\/|$)/i.test(url));
  return toShotstack ? headers(apiKey) : {};
}

function generationBody({
  asset_type,
  model,
  prompt,
  model_options,
  length,
}: {
  asset_type: string;
  model?: string;
  prompt: string;
  model_options?: unknown;
  length?: number;
}): Record<string, unknown> {
  const options = isBlank(model_options) ? {} : parseObject({ value: model_options, label: 'Model Options' });
  return {
    asset: {
      type: asset_type,
      prompt,
      ...(model ? { model } : {}),
      ...(Object.keys(options).length > 0 ? { options } : {}),
    },
    ...(length && length > 0 ? { length } : {}),
  };
}

function getGeneration({ connection, id }: { connection: ShotstackConnection; id: string }): Promise<{ status: number; body: GenerationJob }> {
  return send<GenerationJob>({ connection, method: HttpMethod.GET, path: `/generate/${encodeURIComponent(id)}` });
}

function waitForGeneration({ connection, id, pollMs = POLL_MS, maxWaitMs = MAX_WAIT_MS }: WaitParams): Promise<GenerationJob> {
  return pollJob({
    check: async () => {
      const { status, body } = await getGeneration({ connection, id });
      return { job: body, done: status === 200 && body.status === 'done' };
    },
    label: `Generation ${id}`,
    advice: 'Check it later with Get Generation Status. Shotstack still bills it.',
    pollMs,
    maxWaitMs,
  });
}

async function startGeneration({
  connection,
  body,
  wait,
}: {
  connection: ShotstackConnection;
  body: Record<string, unknown>;
  wait?: boolean;
}): Promise<GenerationSummary> {
  const { status, body: job } = await send<GenerationJob>({ connection, method: HttpMethod.POST, path: '/generate', body });
  if (wait === false || (status === 200 && job.status === 'done')) {
    return generationSummary(job);
  }
  if (!job.id) {
    throw new ShotstackError({ message: 'Shotstack did not return a generation ID.' });
  }
  return generationSummary(await waitForGeneration({ connection, id: job.id }));
}

function generationSummary(job: GenerationJob): GenerationSummary {
  return { id: null, url: null, error: null, ...job };
}

async function listModels({ connection }: { connection: ShotstackConnection }): Promise<GenerationModel[]> {
  const { body } = await send<{ models?: GenerationModel[] }>({
    connection,
    method: HttpMethod.GET,
    path: '/models?expand=options',
  });
  return Array.isArray(body.models) ? body.models : [];
}

async function pollJob<T extends Job>({
  check,
  label,
  advice,
  pollMs,
  maxWaitMs,
}: {
  check: () => Promise<{ job: T; done: boolean }>;
  label: string;
  advice: string;
  pollMs: number;
  maxWaitMs: number;
}): Promise<T> {
  const deadline = Date.now() + maxWaitMs;
  for (let attempt = 0; ; attempt++) {
    const { data, error } = await tryCatch(check);
    const lastPoll = Date.now() + pollMs > deadline;
    if (error && (lastPoll || !canRetry({ error, attempt }))) {
      throw error;
    }
    if (data?.job.status === 'failed') {
      throw new ShotstackError({ message: `${label} failed: ${errorText(data.job.error)}` });
    }
    if (data?.done) {
      return data.job;
    }
    if (lastPoll) {
      throw new ShotstackError({
        message: `${label} is still ${data?.job.status ?? 'running'} after ${maxWaitMs / 60_000} minutes and keeps going. ${advice}`,
      });
    }
    await sleep(pollMs);
  }
}

function likeTemplate({ value, templateValue }: { value: unknown; templateValue: unknown }): unknown {
  if (typeof templateValue === 'number' && typeof value === 'string' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  if (typeof templateValue === 'string' && (typeof value === 'number' || typeof value === 'boolean')) {
    return String(value);
  }
  return value;
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

function canRetry({ error, attempt }: { error: Error; attempt: number }): boolean {
  if (!(error instanceof ShotstackError)) {
    return true;
  }
  const notReadableYet = attempt === 0 && (error.status === 400 || error.status === 404);
  return notReadableYet || error.status === 429 || error.status >= 500;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function messages({ list, keys }: { list: unknown; keys: string[] }): string[] {
  return (Array.isArray(list) ? list : [])
    .filter(isRecord)
    .map((item) => keys.map((key) => item[key]).find((m) => typeof m === 'string' && m.length > 0))
    .filter((m): m is string => typeof m === 'string');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class ShotstackError extends Error {
  readonly status: number;
  constructor({ message, status = 0 }: { message: string; status?: number }) {
    super(message);
    this.status = status;
  }
}

const renderWait = Property.Checkbox({
  displayName: 'Wait for the Render to Finish',
  description:
    'On: the step waits up to 8 minutes and returns the file URL. Off: it returns the render ID straight away; check it later with Get Render Status.',
  required: false,
  defaultValue: true,
});

export const shotstackApi = {
  baseUrl,
  headers,
  send,
  request,
  errorText,
  parseObject,
  getRender,
  waitForRender,
  startRender,
  summary,
  getTemplateMerge,
  mergeList,
  customCallHeaders,
  generationBody,
  generationSummary,
  getGeneration,
  waitForGeneration,
  startGeneration,
  listModels,
  renderWait,
};

const VERSION = '0.0.1';
const POLL_MS = 3_000;
const MAX_WAIT_MS = 480_000;
const NO_DETAILS = 'no details';

type ShotstackConnection = { environment?: string; api_key: string };

type RequestParams = {
  connection: ShotstackConnection;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
};

type WaitParams = {
  connection: ShotstackConnection;
  id: string;
  pollMs?: number;
  maxWaitMs?: number;
};

type Job = { status: string; error?: unknown };

type Render = {
  id: string;
  status: string;
  url?: string;
  poster?: string;
  thumbnail?: string;
  duration?: number;
  error?: string;
};

type MergeField = { find: string; replace: unknown };

type GenerationJob = { id?: string; status: string; url?: string; error?: unknown };

type GenerationSummary = { id: string | null; status: string; url: string | null; error: unknown };

type GenerationModel = { model?: string; name?: string; type?: string; available?: boolean };

type RenderSummary = {
  id: string;
  status: string;
  url: string | null;
  poster: string | null;
  thumbnail: string | null;
  duration: number | null;
  error: string | null;
};
