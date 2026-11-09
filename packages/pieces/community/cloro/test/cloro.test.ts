import { HttpError, httpClient, HttpRequest } from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAiAnswerAction } from '../src/lib/actions/get-ai-answer';
import { searchGoogleAction } from '../src/lib/actions/search-google';
import { searchGoogleNewsAction } from '../src/lib/actions/search-google-news';
import { cloroAuth } from '../src/lib/auth';

const API_KEY = 'sk_test_cloro';
const sendRequest = vi.fn();

beforeEach(() => {
  sendRequest.mockReset();
  vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) => sendRequest(request));
});

afterEach(() => {
  vi.restoreAllMocks();
});

function ok(body: unknown) {
  return { status: 200, headers: {}, body };
}

function request(call = 0): HttpRequest {
  return sendRequest.mock.calls[call][0];
}

function runAction<T extends { run: (ctx: never) => unknown }>(action: T, propsValue: Record<string, unknown>) {
  return action.run({ auth: { secret_text: API_KEY }, propsValue } as never);
}

const GOOGLE = {
  success: true,
  result: {
    organicResults: [
      { position: 1, title: 'First', link: 'https://example.com/a', displayedLink: 'example.com', snippet: 'A.' },
      { position: 2, title: 'Unresolved', link: '', snippet: 'No link.' },
      { position: 3, title: 'Redirect', link: 'https://www.google.com/goto?x=1', snippet: 'R.' },
      { position: 4, title: 'Second', link: 'https://example.org/b', snippet: 'B.', date: '2 days ago' },
    ],
    aioverview: {
      text: 'Overview text.',
      markdown: '**Overview.**',
      sources: [{ label: 'Src', url: 'https://example.net' }],
    },
  },
};

const ANSWER = {
  success: true,
  result: {
    text: 'Plain.',
    markdown: '**Answer.**',
    sources: [
      { position: 1, label: 'Source', url: 'https://example.com' },
      { position: 2, label: 'Again', url: 'https://example.com' },
      { position: 3, label: 'Search page', url: 'https://www.google.com/search?q=x' },
      { position: 4, label: '', url: 'https://example.org' },
    ],
  },
};

describe('auth', () => {
  const validate = (auth: string) => cloroAuth.validate!({ auth, server: {} as never });

  it('checks the key with GET /v1/credits as a Bearer token', async () => {
    sendRequest.mockResolvedValue(ok({ remaining: 100 }));
    expect(await validate(API_KEY)).toEqual({ valid: true });
    expect(request().url).toBe('https://api.cloro.dev/v1/credits');
    expect(request().method).toBe('GET');
    expect(request().authentication).toEqual({ type: 'BEARER_TOKEN', token: API_KEY });
  });

  it('reports a rejected key as invalid', async () => {
    sendRequest.mockRejectedValue(new HttpError({}, { status: 401, responseBody: {} }));
    expect(await validate('bad')).toEqual({ valid: false, error: 'Invalid API key.' });
  });

  it('reports other failures as unreachable', async () => {
    sendRequest.mockRejectedValue(new HttpError({}, { status: 503, responseBody: {} }));
    expect((await validate(API_KEY)).valid).toBe(false);
  });
});

describe('Search Google', () => {
  it('sends the query and country and returns flat rows with direct links only', async () => {
    sendRequest.mockResolvedValue(ok(GOOGLE));
    const rows = await runAction(searchGoogleAction, { query: ' serp api ', country: 'DE', max_results: 5 });

    expect(request().url).toBe('https://api.cloro.dev/v1/monitor/google');
    expect(request().method).toBe('POST');
    expect(request().body).toEqual({ query: 'serp api', country: 'DE' });
    expect(rows).toEqual([
      { position: 1, title: 'First', url: 'https://example.com/a', displayed_link: 'example.com', snippet: 'A.', date: null },
      { position: 4, title: 'Second', url: 'https://example.org/b', displayed_link: null, snippet: 'B.', date: '2 days ago' },
    ]);
  });

  it('caps the results', async () => {
    sendRequest.mockResolvedValue(ok(GOOGLE));
    expect(await runAction(searchGoogleAction, { query: 'q', country: 'US', max_results: 1 })).toHaveLength(1);
  });
});

describe('Search Google News', () => {
  it('returns flat news rows', async () => {
    sendRequest.mockResolvedValue(
      ok({
        success: true,
        result: {
          newsResults: [
            { position: 1, title: 'News', link: 'https://news.example/a', source: 'Example', date: '1 hour ago', snippet: 'S.' },
          ],
        },
      })
    );
    const rows = await runAction(searchGoogleNewsAction, { query: 'cloro', country: 'GB' });

    expect(request().url).toBe('https://api.cloro.dev/v1/monitor/google/news');
    expect(request().body).toEqual({ query: 'cloro', country: 'GB' });
    expect(rows).toEqual([
      { position: 1, title: 'News', url: 'https://news.example/a', source: 'Example', date: '1 hour ago', snippet: 'S.' },
    ]);
  });
});

describe('Get AI Answer', () => {
  it.each([
    ['google_ai_mode', '/v1/monitor/aimode'],
    ['bing_ai_mode', '/v1/monitor/bing/aimode'],
    ['chatgpt', '/v1/monitor/chatgpt'],
    ['gemini', '/v1/monitor/gemini'],
  ])('asks %s and returns a flat answer with its sources', async (engine, path) => {
    sendRequest.mockResolvedValue(ok(ANSWER));
    const answer = await runAction(getAiAnswerAction, { engine, prompt: 'What is a SERP?', country: 'US' });

    expect(request().url).toBe(`https://api.cloro.dev${path}`);
    expect(request().body).toEqual({ prompt: 'What is a SERP?', country: 'US', include: { markdown: true } });
    expect(answer).toEqual({
      engine,
      prompt: 'What is a SERP?',
      country: 'US',
      answer_found: true,
      answer_markdown: '**Answer.**',
      answer_text: 'Plain.',
      source_count: 2,
      source_urls: 'https://example.com, https://example.org',
      sources: 'Source: https://example.com\nhttps://example.org',
    });
  });

  it('reads the Google AI Overview from a Google search', async () => {
    sendRequest.mockResolvedValue(ok(GOOGLE));
    const answer = await runAction(getAiAnswerAction, { engine: 'google_ai_overview', prompt: 'serp api', country: 'US' });

    expect(request().url).toBe('https://api.cloro.dev/v1/monitor/google');
    expect(request().body).toEqual({ query: 'serp api', country: 'US', include: { aioverview: { markdown: true } } });
    expect(answer).toMatchObject({
      answer_found: true,
      answer_markdown: '**Overview.**',
      answer_text: 'Overview text.',
      source_urls: 'https://example.net',
    });
  });

  it('says when Google showed no AI Overview', async () => {
    sendRequest.mockResolvedValue(ok({ success: true, result: { organicResults: [] } }));
    const answer = await runAction(getAiAnswerAction, { engine: 'google_ai_overview', prompt: 'q', country: 'US' });

    expect(answer).toMatchObject({ answer_found: false, answer_markdown: null, source_count: 0, source_urls: null });
  });

  it('refuses a Bing AI Mode prompt that is too long after URL encoding', async () => {
    await expect(
      runAction(getAiAnswerAction, { engine: 'bing_ai_mode', prompt: '中'.repeat(600), country: 'US' })
    ).rejects.toThrow(/too long for Bing AI Mode/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('puts the cloro error code and message on a failed request', async () => {
    sendRequest.mockRejectedValue(
      new HttpError({}, { status: 402, responseBody: { success: false, error: { code: 'INSUFFICIENT_CREDITS', message: 'Not enough credits' } } })
    );
    await expect(
      runAction(getAiAnswerAction, { engine: 'gemini', prompt: 'hi', country: 'US' })
    ).rejects.toThrow('cloro returned HTTP 402: INSUFFICIENT_CREDITS Not enough credits');
  });

  it('fails when the API returns no result', async () => {
    sendRequest.mockResolvedValue(ok({ success: false }));
    await expect(
      runAction(getAiAnswerAction, { engine: 'chatgpt', prompt: 'hi', country: 'US' })
    ).rejects.toThrow('cloro /v1/monitor/chatgpt returned no result.');
  });
});
