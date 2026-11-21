import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AppConnectionType,
  createMockActionContext,
} from '@activepieces/pieces-framework';
import { aiScraperAction } from '../src/lib/actions/ai-scraper';
import { aiScraper } from '../src/lib/common/ai-scraper';
import { scrapeless } from '../src';

const fetchMock = vi.fn<typeof fetch>();
const apiKey = 'test-api-key-do-not-disclose';
const taskId = 'task-123';
const tlsSetting = process.env['NODE_TLS_REJECT_UNAUTHORIZED'];

function respond({ body, status = 200 }: { body: unknown; status?: number }) {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

function createTask() {
  return aiScraper.createChatgptTask({
    apiKey,
    prompt: 'Explain what an API is in English.',
    country: 'US',
  });
}

function queryTask() {
  return aiScraper.getTaskResult({ apiKey, taskId });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  if (tlsSetting === undefined) {
    delete process.env['NODE_TLS_REJECT_UNAUTHORIZED'];
  } else {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = tlsSetting;
  }
});

describe('Piece registration', () => {
  it('registers one unified AI Scraper action while retaining all six published action IDs', () => {
    expect(Object.keys(scrapeless.actions())).toEqual([
      'google_search_api',
      'crawl_scrape',
      'crawl_crawl',
      'google_trends_api',
      'universal_scraping_api',
      'ai_scraper',
      'custom_api_call',
    ]);
  });

  it('exposes the combined action with conservative write and retry hints', () => {
    expect(aiScraperAction.audience).toBe('both');
    expect(aiScraperAction.classification).toBe('WRITE');
    expect(aiScraperAction.aiMetadata?.idempotent).toBe(false);
    expect(aiScraperAction.outputSchema?.fields).toHaveLength(21);
  });
});

describe('ChatGPT task creation', () => {
  it('executes the real action with v2 auth, normalized country, and shopping disabled', async () => {
    respond({ body: { task_id: taskId }, status: 201 });
    const context = createMockActionContext<typeof aiScraperAction.props>({
      propsValue: {
        operation: 'create_task',
        wait_settings: undefined,
        output_format: 'raw',
        website: { engine: 'chatgpt' },
        parameters: {
          prompt: 'Explain what an API is in English.',
          country: ' us ',
          web_search: undefined,
          shopping: undefined,
          should_fetch_share_link: undefined,
        },
      },
    });
    const output = await aiScraperAction.run({
      ...context,
      auth: { type: AppConnectionType.SECRET_TEXT, secret_text: apiKey },
    });
    expect(output).toMatchObject({
      task_id: taskId,
      status: 'pending',
      completed: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.scrapeless.com/api/v2/scraper/request');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({ 'x-api-token': apiKey });
    expect(init?.redirect).toBe('manual');
    expect(JSON.parse(String(init?.body))).toEqual({
      actor: 'scraper.chatgpt',
      input: {
        prompt: 'Explain what an API is in English.',
        country: 'US',
        web_search: true,
        shopping: false,
      },
    });
  });

  it('forwards explicit web search and shopping choices', async () => {
    respond({ body: { task_id: taskId, status: 'pending' }, status: 201 });
    await aiScraper.createChatgptTask({
      apiKey,
      prompt: 'Test',
      country: 'GB',
      webSearch: false,
      shopping: true,
    });
    expect(
      JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).input
    ).toMatchObject({ web_search: false, shopping: true });
  });

  it('does not repeat an uncertain submission after a network timeout', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network timeout'));
    await expect(createTask()).rejects.toThrow('A task may have been created');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(aiScraperAction.aiMetadata?.idempotent).toBe(false);
    expect(aiScraperAction.errorHandlingOptions.retryOnFailure).toEqual({
      defaultValue: false,
      hide: true,
    });
  });

  it('does not repeat a creation request after a server error', async () => {
    respond({
      body: { message: 'Service temporarily unavailable' },
      status: 503,
    });
    await expect(createTask()).rejects.toThrow('HTTP 503');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects an empty prompt before making a billable request', async () => {
    await expect(
      aiScraper.createChatgptTask({ apiKey, prompt: '  ', country: 'US' })
    ).rejects.toThrow('Prompt must not be empty');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid country before making a request', async () => {
    await expect(
      aiScraper.createChatgptTask({ apiKey, prompt: 'Test', country: 'USA' })
    ).rejects.toThrow('two-letter');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a creation response without a task ID', async () => {
    respond({ body: { status: 'pending' }, status: 201 });
    await expect(createTask()).rejects.toThrow('no task_id');
  });

  it.each(['../another-task', 'task?token=bad', 'x'.repeat(257), 'task-123\n'])(
    'rejects an unusable task ID returned by creation: %s',
    async (invalidId) => {
      respond({ body: { task_id: invalidId, status: 'pending' }, status: 201 });
      await expect(createTask()).rejects.toThrow('invalid task_id');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  );

  it('redacts a credential reflected in a failed creation task ID', async () => {
    respond({ body: { task_id: apiKey, status: 'failed' } });
    await expect(createTask()).rejects.toThrow('task [redacted] failed');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('AI Scraper result queries', () => {
  it.each(['pending', 'running', 'success'])(
    'rejects a response for a different task in state %s',
    async (status) => {
      respond({
        body: {
          task_id: 'different-task-456',
          status,
          task_result: { result_text: 'An answer for a different task.' },
        },
      });
      await expect(queryTask()).rejects.toThrow('does not match');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toBe(
        `https://api.scrapeless.com/api/v2/scraper/result/${taskId}`
      );
    }
  );

  it('uses the same action in query mode from running to success', async () => {
    const payload = {
      result_text: 'An API lets software communicate.',
      links: ['https://example.com'],
      search_result: [{ title: 'API reference', url: 'https://example.com' }],
      content_references: [{ title: 'Reference', url: 'https://example.com' }],
      additional_vendor_field: { preserved: true },
    };
    respond({ body: { task_id: taskId }, status: 201 });
    respond({ body: { status: 'running' }, status: 202 });
    respond({ body: { status: 'success', task_result: payload } });
    const created = await createTask();
    const context = createMockActionContext<typeof aiScraperAction.props>({
      propsValue: { operation: 'get_task_result', wait_settings: undefined, output_format: 'raw', website: undefined, parameters: { task_id: created.task_id } },
    });
    const authenticatedContext: Parameters<typeof aiScraperAction.run>[0] = {
      ...context,
      auth: { type: AppConnectionType.SECRET_TEXT, secret_text: apiKey },
    };
    const running = await aiScraperAction.run(authenticatedContext);
    expect(running).toMatchObject({
      completed: false,
      status: 'running',
      task_id: taskId,
    });
    const result = await aiScraperAction.run(authenticatedContext);
    expect(result).toMatchObject({
      completed: true,
      task_id: taskId,
      result_text: payload.result_text,
      task_result: payload,
    });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://api.scrapeless.com/api/v2/scraper/request',
      `https://api.scrapeless.com/api/v2/scraper/result/${taskId}`,
      `https://api.scrapeless.com/api/v2/scraper/result/${taskId}`,
    ]);
    expect(
      fetchMock.mock.calls
        .slice(1)
        .every(([, init]) => init?.method === 'GET' && init.body === undefined)
    ).toBe(true);
  });

  it.each(['pending', 'running'])(
    'does not mistake HTTP 200 with %s for a completed task',
    async (status) => {
      respond({ body: { status } });
      expect(await queryTask()).toMatchObject({
        status,
        completed: false,
        task_result: null,
      });
    }
  );

  it('handles HTTP 202 without a response body as still running', async () => {
    respond({ body: null, status: 202 });
    expect(await queryTask()).toMatchObject({
      status: 'running',
      completed: false,
      task_id: taskId,
    });
  });

  it('fails the step for a business failure even when HTTP status is 200', async () => {
    respond({ body: { status: 'failed', message: 'Upstream task failed' } });
    await expect(queryTask()).rejects.toThrow('Upstream task failed');
  });

  it('redacts the API key from vendor error messages', async () => {
    respond({
      body: { status: 'failed', message: `Token ${apiKey} was rejected` },
    });
    await expect(queryTask()).rejects.toThrow('[redacted]');
  });

  it.each([
    { status: 401, expected: 'API key was rejected' },
    { status: 403, expected: 'Access denied' },
    { status: 410, expected: 'expired' },
    { status: 429, expected: 'rate limit' },
  ])(
    'reports HTTP $status without exposing a raw error body',
    async ({ status, expected }) => {
      respond({ body: { message: apiKey }, status });
      await expect(queryTask()).rejects.toThrow(expected);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  );

  it('rejects an unknown business status', async () => {
    respond({ body: { status: 'unexpected' } });
    await expect(queryTask()).rejects.toThrow('unrecognized task status');
  });

  it('rejects successful status without the promised result', async () => {
    respond({ body: { status: 'success' } });
    await expect(queryTask()).rejects.toThrow('no task_result');
  });

  it.each(['', '../me', 'task?token=bad', 'task/id'])(
    'rejects unsafe or empty task IDs: %s',
    async (invalidId) => {
      await expect(
        aiScraper.getTaskResult({ apiKey, taskId: invalidId })
      ).rejects.toThrow('Task ID');
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it('does not forward authentication to redirects', async () => {
    respond({ body: {}, status: 302 });
    await expect(queryTask()).rejects.toThrow('unexpected redirect');
    expect(fetchMock.mock.calls[0][1]?.redirect).toBe('manual');
  });
});
