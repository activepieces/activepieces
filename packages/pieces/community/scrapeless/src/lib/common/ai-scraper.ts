import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { tryCatch } from '@activepieces/pieces-framework';

async function createChatgptTask({
  apiKey,
  prompt,
  country,
  webSearch,
  shopping,
  shareLink,
}: ChatgptTaskInput): Promise<AiScraperTask> {
  return createTask({
    apiKey,
    engine: 'chatgpt',
    prompt,
    country,
    webSearch,
    shopping,
    shareLink,
  });
}

function taskBody({
  engine,
  prompt,
  country,
  webSearch,
  shopping,
  mode,
  location,
  uule,
  shareLink,
}: CreateTaskInput) {
  const config = Object.hasOwn(engineConfigs, engine)
    ? engineConfigs[engine]
    : undefined;
  if (!config) {
    throw new Error('Unsupported AI Scraper engine.');
  }
  if (!prompt.trim()) {
    throw new Error('Prompt must not be empty.');
  }
  const normalizedCountry = country.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalizedCountry)) {
    throw new Error(
      'Country must be a two-letter ISO country code, such as US.'
    );
  }
  const options: Record<string, unknown> = {
    web_search: webSearch,
    shopping,
    mode,
    location: location?.trim() || undefined,
    uule: uule?.trim() || undefined,
    should_fetch_share_link: shareLink,
  };
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined && !config.options.includes(key)) {
      throw new Error(`${key} is not supported by ${engine}.`);
    }
  }
  if (
    config.modes &&
    !config.modes.includes(mode ?? config.defaultMode ?? '')
  ) {
    throw new Error(`Unsupported ${engine} mode.`);
  }
  if (options['location'] && options['uule']) {
    throw new Error(
      'Location and UULE are mutually exclusive. Supply only one.'
    );
  }
  const defaults: Record<string, unknown> = {
    web_search: true,
    shopping: false,
    mode: config.defaultMode,
    should_fetch_share_link: false,
  };
  const input = Object.fromEntries([
    ['prompt', prompt],
    ['country', normalizedCountry],
    ...config.options.flatMap((key) => {
      const value = options[key] ?? defaults[key];
      if (key === 'should_fetch_share_link' && shareLink === undefined) {
        return [];
      }
      return value === undefined ? [] : [[key, value]];
    }),
  ]);
  return { actor: `scraper.${config.actor}`, input };
}

function validateTask(input: CreateTaskInput): void {
  taskBody(input);
}

async function createTask(input: CreateTaskInput): Promise<AiScraperTask> {
  const body = taskBody(input);
  const response = await request({ apiKey: input.apiKey, method: HttpMethod.POST, path: '/request', body });
  return parseTask({ ...response, apiKey: input.apiKey });
}

async function getTaskResult({
  apiKey,
  taskId,
}: {
  apiKey: string;
  taskId: string;
}): Promise<AiScraperTask> {
  const normalizedTaskId = taskId.trim();
  if (!isTaskId(normalizedTaskId)) {
    throw new Error(
      'Task ID must be the task_id returned by an AI Scraper action.'
    );
  }
  const response = await request({
    apiKey,
    method: HttpMethod.GET,
    path: `/result/${encodeURIComponent(normalizedTaskId)}`,
  });
  return parseTask({ ...response, taskId: normalizedTaskId, apiKey });
}

async function request({ apiKey, method, path, body }: RequestInput) {
  const { data, error } = await tryCatch(() =>
    httpClient.sendRequest<unknown>({
      method,
      url: `https://api.scrapeless.com/api/v2/scraper${path}`,
      headers: { 'x-api-token': apiKey },
      body,
      timeout: 30000,
      retries: 0,
      followRedirects: false,
      redactBodyInErrors: true,
    })
  );
  if (error) {
    if (error instanceof HttpError) {
      const status = error.response.status;
      const messages: Record<number, string> = {
        401: 'The Scrapeless API key was rejected. Check your connection.',
        403: 'Access denied. Check your Scrapeless account permissions.',
        410: 'The task result has expired. Results are retained for 4 minutes after completion.',
        429: 'Scrapeless rate limit reached. Wait before trying again.',
      };
      const details = isRecord(error.response.body)
        ? error.response.body['message']
        : undefined;
      throw new Error(
        messages[status] ??
          `Scrapeless returned HTTP ${status}.${
            typeof details === 'string'
              ? ` ${redact({ value: details, apiKey })}`
              : ''
          }`
      );
    }
    throw new Error(
      method === HttpMethod.POST
        ? 'The task creation request did not complete. A task may have been created. Check your Scrapeless dashboard before submitting again to avoid duplicate charges.'
        : 'The result request did not complete. Retry with the same Task ID.'
    );
  }
  if (data.status >= 300) {
    throw new Error('Scrapeless returned an unexpected redirect.');
  }
  return { httpStatus: data.status, body: data.body };
}

function parseTask({
  httpStatus,
  body,
  taskId,
  apiKey,
}: {
  httpStatus: number;
  body: unknown;
  taskId?: string;
  apiKey: string;
}): AiScraperTask {
  const envelope = isRecord(body) ? body : {};
  const id = envelope['task_id'] ?? taskId;
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error(
      'Scrapeless returned no task_id. Check the dashboard before submitting another task.'
    );
  }
  if (!isTaskId(id)) {
    throw new Error(
      'Scrapeless returned an invalid task_id. A task may have been created. Check the dashboard before submitting another task.'
    );
  }
  if (taskId !== undefined && id !== taskId) {
    throw new Error(
      'Scrapeless returned a task_id that does not match the requested task. Retry the result query with the original Task ID.'
    );
  }
  const status =
    envelope['status'] ??
    (httpStatus === 201
      ? 'pending'
      : httpStatus === 202
      ? 'running'
      : undefined);
  if (status === 'failed') {
    const message = envelope['message'];
    throw new Error(
      redact({
        value: `AI Scraper task ${id} failed.${
          typeof message === 'string' ? ` ${message}` : ''
        }`,
        apiKey,
      })
    );
  }
  if (status !== 'pending' && status !== 'running' && status !== 'success') {
    throw new Error(
      'Scrapeless returned an unrecognized task status. Retry the result query with the same Task ID.'
    );
  }
  const taskResult = envelope['task_result'] ?? null;
  if (status === 'success' && taskResult === null) {
    throw new Error(
      'Scrapeless marked the task successful but returned no task_result. Retry the result query with the same Task ID.'
    );
  }
  const result = isRecord(taskResult) ? taskResult : {};
  const answerField = [
    'result_text',
    'full_response',
    'content',
    'md_text',
    'raw_text',
    'result_md',
  ].find((field) => typeof result[field] === 'string' && result[field].trim());
  const answer = answerField ? result[answerField] : null;
  return {
    task_id: id,
    status,
    completed: status === 'success',
    result_text: typeof answer === 'string' ? answer : null,
    answer_field: answerField ?? null,
    has_answer: typeof answer === 'string' && answer.trim().length > 0,
    citations: arrayField({ result, field: 'citations' }),
    web_results: arrayField({ result, field: 'web_results' }),
    web_search_results: arrayField({ result, field: 'web_search_results' }),
    x_search_results: arrayField({ result, field: 'x_search_results' }),
    source: arrayField({ result, field: 'source' }),
    web_source: arrayField({ result, field: 'web_source' }),
    references: arrayField({ result, field: 'references' }),
    sources: arrayField({ result, field: 'sources' }),
    share_url:
      typeof result['share_url'] === 'string' ? result['share_url'] : null,
    links: Array.isArray(result['links']) ? result['links'] : [],
    search_result: Array.isArray(result['search_result'])
      ? result['search_result']
      : [],
    content_references: Array.isArray(result['content_references'])
      ? result['content_references']
      : [],
    task_result: taskResult,
  };
}

function arrayField({
  result,
  field,
}: {
  result: Record<string, unknown>;
  field: string;
}): unknown[] {
  const value = result[field];
  return Array.isArray(value) ? value : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTaskId(value: string): boolean {
  return value === value.trim() && /^[A-Za-z0-9][A-Za-z0-9_-]{0,255}$/.test(value);
}

function redact({ value, apiKey }: { value: string; apiKey: string }): string {
  return apiKey ? value.split(apiKey).join('[redacted]') : value;
}

const engineConfigs: Record<string, EngineConfig> = {
  chatgpt: {
    actor: 'chatgpt',
    options: ['web_search', 'shopping', 'should_fetch_share_link'],
  },
  perplexity: {
    actor: 'perplexity',
    options: ['web_search', 'should_fetch_share_link'],
  },
  copilot: {
    actor: 'copilot',
    options: ['mode', 'should_fetch_share_link'],
    modes: ['search', 'smart', 'chat', 'reasoning', 'study'],
    defaultMode: 'search',
  },
  gemini: { actor: 'gemini', options: ['shopping'] },
  aimode: {
    actor: 'aimode',
    options: ['shopping', 'location', 'uule', 'should_fetch_share_link'],
  },
  overview: {
    actor: 'overview',
    options: ['shopping', 'location', 'uule', 'should_fetch_share_link'],
  },
  grok: {
    actor: 'grok',
    options: ['mode', 'should_fetch_share_link'],
    modes: ['MODEL_MODE_FAST', 'MODEL_MODE_EXPERT', 'MODEL_MODE_AUTO'],
    defaultMode: 'MODEL_MODE_FAST',
  },
  alexa: { actor: 'alexa', options: [] },
};

export const aiScraper = { createChatgptTask, createTask, getTaskResult, validateTask };

type ChatgptTaskInput = {
  apiKey: string;
  prompt: string;
  country: string;
  webSearch?: boolean;
  shopping?: boolean;
  shareLink?: boolean;
};

type CreateTaskInput = ChatgptTaskInput & {
  engine: string;
  mode?: string;
  location?: string;
  uule?: string;
};

type EngineConfig = {
  actor: string;
  options: string[];
  modes?: string[];
  defaultMode?: string;
};

type RequestInput = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: { actor: string; input: Record<string, unknown> };
};

type AiScraperTask = {
  task_id: string;
  status: 'pending' | 'running' | 'success';
  completed: boolean;
  result_text: string | null;
  answer_field: string | null;
  has_answer: boolean;
  citations: unknown[];
  web_results: unknown[];
  web_search_results: unknown[];
  x_search_results: unknown[];
  source: unknown[];
  web_source: unknown[];
  references: unknown[];
  sources: unknown[];
  share_url: string | null;
  links: unknown[];
  search_result: unknown[];
  content_references: unknown[];
  task_result: unknown;
};
