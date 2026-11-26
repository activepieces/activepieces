import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AppConnectionType,
  createMockActionContext,
} from '@activepieces/pieces-framework';
import { scrapeless } from '../src';
import { aiScraper } from '../src/lib/common/ai-scraper';

const fetchMock = vi.fn<typeof fetch>();
const apiKey = 'test-engine-key';
const taskId = 'engine-task-123';
const auth: { type: AppConnectionType.SECRET_TEXT; secret_text: string } = {
  type: AppConnectionType.SECRET_TEXT,
  secret_text: apiKey,
};
const cases = [
  {
    id: 'perplexity',
    actor: 'perplexity',
    props: { web_search: false, should_fetch_share_link: true },
    input: { web_search: false, should_fetch_share_link: true },
  },
  {
    id: 'copilot',
    actor: 'copilot',
    props: { mode: 'study', should_fetch_share_link: false },
    input: { mode: 'study', should_fetch_share_link: false },
  },
  {
    id: 'gemini',
    actor: 'gemini',
    props: { shopping: false },
    input: { shopping: false },
  },
  {
    id: 'google_ai_mode',
    actor: 'aimode',
    props: {
      shopping: false,
      location: 'New York,New York,United States',
      uule: undefined,
      should_fetch_share_link: false,
    },
    input: {
      shopping: false,
      location: 'New York,New York,United States',
      should_fetch_share_link: false,
    },
  },
  {
    id: 'google_ai_overview',
    actor: 'overview',
    props: {
      shopping: false,
      location: undefined,
      uule: 'encoded-uule',
      should_fetch_share_link: true,
    },
    input: {
      shopping: false,
      uule: 'encoded-uule',
      should_fetch_share_link: true,
    },
  },
  {
    id: 'grok',
    actor: 'grok',
    props: { mode: 'MODEL_MODE_EXPERT', should_fetch_share_link: false },
    input: { mode: 'MODEL_MODE_EXPERT', should_fetch_share_link: false },
  },
  { id: 'alexa', actor: 'alexa', props: {}, input: {} },
];

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function respond({ body, status = 200 }: { body: unknown; status?: number }) {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

async function query(result: Record<string, unknown>) {
  respond({
    body: { task_id: taskId, status: 'success', task_result: result },
  });
  return aiScraper.getTaskResult({ apiKey, taskId });
}

describe('Engine action request isolation', () => {
  it.each(cases)(
    '$id executes its real registered action with only its documented fields',
    async ({ actor, props, input }) => {
      const action = scrapeless.getAction('ai_scraper');
      expect(action).toBeDefined();
      if (!action) throw new Error('Action is missing.');
      respond({ body: { task_id: taskId, status: 'pending' }, status: 201 });
      await action.run({
        ...createMockActionContext({
          propsValue: {
            operation: 'create_task',
            website: { engine: actor },
            parameters: { prompt: 'Explain an HTTP API in English.', country: ' us ', ...props },
          },
        }),
        auth,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.scrapeless.com/api/v2/scraper/request');
      expect(JSON.parse(String(init?.body))).toEqual({
        actor: `scraper.${actor}`,
        input: {
          prompt: 'Explain an HTTP API in English.',
          country: 'US',
          ...input,
        },
      });
      expect(action.audience).toBe('both');
      expect(action.classification).toBe('WRITE');
      expect(action.aiMetadata?.idempotent).toBe(false);
      expect(action.errorHandlingOptions.retryOnFailure).toEqual({
        defaultValue: false,
        hide: true,
      });
    }
  );

  it.each([
    { mode: 'reasoning', shareLink: undefined },
    { mode: 'reasoning', shareLink: false },
    { mode: 'search', shareLink: false },
  ])(
    'preserves the registered Copilot action payload for $mode and share-link $shareLink',
    async ({ mode, shareLink }) => {
      const action = scrapeless.getAction('ai_scraper');
      if (!action) throw new Error('Copilot action is missing.');
      respond({ body: { task_id: taskId }, status: 201 });
      await action.run({
        ...createMockActionContext({
          propsValue: {
            operation: 'create_task',
            website: { engine: 'copilot' },
            parameters: { prompt: 'Explain an HTTP API in English.', country: 'US', mode, should_fetch_share_link: shareLink },
          },
        }),
        auth,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const input = {
        prompt: 'Explain an HTTP API in English.',
        country: 'US',
        mode,
        ...(shareLink === undefined
          ? {}
          : { should_fetch_share_link: shareLink }),
      };
      expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
        actor: 'scraper.copilot',
        input,
      });
    }
  );

  it.each(['search', 'smart', 'chat', 'reasoning', 'study'])(
    'accepts Copilot mode %s without remapping',
    async (mode) => {
      respond({ body: { task_id: taskId }, status: 201 });
      await aiScraper.createTask({
        apiKey,
        engine: 'copilot',
        prompt: 'Test',
        country: 'US',
        mode,
      });
      expect(
        JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).input.mode
      ).toBe(mode);
    }
  );

  it.each(['MODEL_MODE_FAST', 'MODEL_MODE_EXPERT', 'MODEL_MODE_AUTO'])(
    'accepts Grok mode %s without remapping',
    async (mode) => {
      respond({ body: { task_id: taskId }, status: 201 });
      await aiScraper.createTask({
        apiKey,
        engine: 'grok',
        prompt: 'Test',
        country: 'US',
        mode,
      });
      expect(
        JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).input.mode
      ).toBe(mode);
    }
  );

  it.each([
    { engine: 'unknown' },
    { engine: 'constructor' },
    { engine: 'toString' },
    { engine: 'grok', mode: 'expert' },
    { engine: 'copilot', mode: 'deep' },
    { engine: 'alexa', shopping: false },
    { engine: 'gemini', webSearch: true },
    { engine: 'perplexity', mode: 'search' },
    { engine: 'aimode', location: 'New York', uule: 'encoded' },
    { engine: 'overview', location: 'New York', uule: 'encoded' },
  ])(
    'rejects invalid or conflicting input before HTTP: $engine',
    async (input) => {
      await expect(
        aiScraper.createTask({
          apiKey,
          prompt: 'Test',
          country: 'US',
          ...input,
        })
      ).rejects.toThrow();
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it.each(['chatgpt', 'gemini', 'aimode', 'overview'])(
    'sets shopping false explicitly for %s when unspecified',
    async (engine) => {
      respond({ body: { task_id: taskId }, status: 201 });
      await aiScraper.createTask({
        apiKey,
        engine,
        prompt: 'Test',
        country: 'US',
      });
      expect(
        JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).input.shopping
      ).toBe(false);
    }
  );

  it.each(['chatgpt', 'gemini', 'aimode', 'overview'])(
    'forwards explicit shopping opt-in for %s',
    async (engine) => {
      respond({ body: { task_id: taskId }, status: 201 });
      await aiScraper.createTask({
        apiKey,
        engine,
        prompt: 'Test',
        country: 'US',
        shopping: true,
      });
      expect(
        JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).input.shopping
      ).toBe(true);
    }
  );

  it.each(['chatgpt', 'perplexity', 'copilot', 'aimode', 'overview', 'grok'])(
    'forwards optional share-link requests only for supported engine %s',
    async (engine) => {
      respond({ body: { task_id: taskId }, status: 201 });
      await aiScraper.createTask({
        apiKey,
        engine,
        prompt: 'Test',
        country: 'US',
        shareLink: true,
      });
      expect(
        JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).input
          .should_fetch_share_link
      ).toBe(true);
    }
  );

  it('does not leak empty geo strings into the request', async () => {
    respond({ body: { task_id: taskId }, status: 201 });
    await aiScraper.createTask({
      apiKey,
      engine: 'aimode',
      prompt: 'Test',
      country: 'US',
      location: ' ',
      uule: '',
    });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).input).toEqual({
      prompt: 'Test',
      country: 'US',
      shopping: false,
    });
  });
});

describe('Cross-engine answer and source preservation', () => {
  it.each([
    'result_text',
    'full_response',
    'content',
    'md_text',
    'raw_text',
    'result_md',
  ])('normalizes %s and retains the complete native payload', async (field) => {
    const payload = {
      [field]: 'An English answer.',
      extra: { zero: 0, disabled: false, nullable: null },
    };
    const output = await query(payload);
    expect(output).toMatchObject({
      status: 'success',
      completed: true,
      has_answer: true,
      answer_field: field,
      result_text: 'An English answer.',
      task_result: payload,
    });
  });

  it('falls back from empty primary text to Alexa plain text', async () => {
    expect(
      await query({ md_text: ' ', raw_text: 'Plain answer.' })
    ).toMatchObject({ result_text: 'Plain answer.', answer_field: 'raw_text' });
  });

  it('keeps task completion separate from a missing Google overview', async () => {
    expect(await query({ content: '', rawtext: '', source: [] })).toMatchObject(
      {
        completed: true,
        has_answer: false,
        answer_field: null,
        result_text: null,
      }
    );
  });

  it('does not replace Alexa task completion with the nested engine flag', async () => {
    expect(
      await query({ md_text: 'An answer fragment.', completed: false })
    ).toMatchObject({ completed: true, task_result: { completed: false } });
  });

  it('does not silently claim Grok Expert when the response reports Fast', async () => {
    expect(
      await query({ full_response: 'Answer.', user_model: 'fast' })
    ).toMatchObject({ task_result: { user_model: 'fast' } });
  });

  it('preserves native source arrays separately and retains footnotes and media', async () => {
    const fields = [
      'citations',
      'links',
      'search_result',
      'content_references',
      'web_results',
      'web_search_results',
      'x_search_results',
      'source',
      'web_source',
      'references',
      'sources',
    ];
    const arrays = Object.fromEntries(
      fields.map((field) => [
        field,
        [{ title: field, url: 'https://example.com/' }],
      ])
    );
    const payload = {
      result_text: 'Answer.',
      ...arrays,
      media_items: [{ medium: 'video' }],
      footnotes: { one: { url: 'https://example.com/note' } },
      share_url: 'https://example.com/shared',
    };
    const output = await query(payload);
    expect(output).toMatchObject({
      ...arrays,
      share_url: payload.share_url,
      task_result: payload,
    });
  });
});
