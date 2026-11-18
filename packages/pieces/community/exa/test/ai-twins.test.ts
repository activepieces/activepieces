import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exaSearchAction } from '../src/lib/actions/ai/exa-search';
import { exaGetContentsAction } from '../src/lib/actions/ai/exa-get-contents';
import { exaAnswerAction } from '../src/lib/actions/ai/exa-answer';
import { lastRequest, ok, runAction, sendRequest } from './helpers';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  const { mockHttpClient } = await import('./helpers');
  return { ...actual, ...mockHttpClient() };
});

beforeEach(() => {
  sendRequest.mockReset();
});

describe('exa_search', () => {
  it('sends include and exclude domains together, as the Exa spec allows', async () => {
    ok({ body: { results: [] } });
    await runAction({
      action: exaSearchAction,
      propsValue: { query: 'q', includeText: false, includeDomains: ['example.com'], excludeDomains: ['example.com/careers'] },
    });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(lastRequest().body).toEqual({
      query: 'q',
      type: 'auto',
      includeDomains: ['example.com'],
      excludeDomains: ['example.com/careers'],
    });
  });

  it('refuses date filters with the company category', async () => {
    await expect(
      runAction({ action: exaSearchAction, propsValue: { query: 'q', category: 'company', startPublishedDate: '2026-01-01T00:00:00Z' } }),
    ).rejects.toThrow(/company category/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('refuses an unknown search type and a malformed country before calling Exa', async () => {
    await expect(runAction({ action: exaSearchAction, propsValue: { query: 'q', type: 'semantic' } })).rejects.toThrow(
      /Search Type must be one of/,
    );
    await expect(runAction({ action: exaSearchAction, propsValue: { query: 'q', userLocation: 'USA' } })).rejects.toThrow(
      /two-letter country code/,
    );
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('flattens results to the output schema keys and reports cost', async () => {
    ok({
      body: {
        results: [{ id: 'u', title: 'T', url: 'https://t.com', highlights: ['a', 'b'], favicon: 'https://t.com/f.ico' }],
        costDollars: { total: 0.007 },
      },
    });
    const result = await runAction({
      action: exaSearchAction,
      propsValue: { query: 'q', includeText: true, highlightsQuery: 'why', userLocation: 'de' },
    });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(lastRequest().body).toEqual({
      query: 'q',
      type: 'auto',
      userLocation: 'DE',
      contents: { text: true, highlights: { query: 'why' } },
    });
    expect(result).toEqual({
      count: 1,
      cost_total: 0.007,
      results: [
        {
          id: 'u',
          title: 'T',
          url: 'https://t.com',
          published_date: null,
          author: null,
          text: null,
          highlights: 'a\nb',
          summary: null,
          image: null,
        },
      ],
    });
  });
});

describe('exa_get_contents', () => {
  it('surfaces failed URLs', async () => {
    ok({
      body: {
        results: [{ id: 'https://a.com', url: 'https://a.com', text: 'x' }],
        statuses: [
          { id: 'https://a.com', status: 'success', source: 'cached' },
          { id: 'https://bad.example', status: 'error', error: { tag: 'CRAWL_NOT_FOUND', httpStatusCode: 404 } },
        ],
      },
    });
    const result = await runAction({ action: exaGetContentsAction, propsValue: { urls: ['https://a.com', 'https://bad.example'] } });
    expect(result).toMatchObject({
      failed_count: 1,
      statuses: [
        { url: 'https://a.com', status: 'success', source: 'cached', error_tag: null },
        { url: 'https://bad.example', status: 'error', error_tag: 'CRAWL_NOT_FOUND', error_http_status: 404 },
      ],
    });
  });

  it('returns each page\'s subpages instead of dropping them', async () => {
    ok({
      body: {
        results: [{ id: 'https://a.com', url: 'https://a.com', subpages: [{ id: 'https://a.com/pricing', url: 'https://a.com/pricing', title: 'Pricing', text: 'p', favicon: 'f' }] }],
        statuses: [{ id: 'https://a.com', status: 'success' }],
      },
    });
    const result = await runAction({ action: exaGetContentsAction, propsValue: { urls: ['https://a.com'], subpages: 1, subpageTarget: 'pricing' } });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(lastRequest().body).toMatchObject({ subpages: 1, subpageTarget: 'pricing' });
    expect(result).toMatchObject({
      results: [{ url: 'https://a.com', subpages: [{ url: 'https://a.com/pricing', title: 'Pricing', text: 'p' }] }],
      failed_count: 0,
    });
    expect(JSON.stringify(result)).not.toContain('favicon');
  });

  it('counts each failed URL once, and a subpage status cannot hide a failed page', async () => {
    ok({
      body: {
        results: [{ id: 'https://a.com', url: 'https://a.com' }],
        statuses: [
          { id: 'https://a.com', status: 'success' },
          { id: 'https://b.com/sub', status: 'success' },
          { id: 'https://b.com', status: 'error', error: { tag: 'CRAWL_NOT_FOUND', httpStatusCode: 404 } },
        ],
      },
    });
    const result = await runAction({ action: exaGetContentsAction, propsValue: { urls: ['https://a.com', 'https://b.com', 'https://b.com'] } });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(lastRequest().body.urls).toEqual(['https://a.com', 'https://b.com']);
    expect(result).toMatchObject({ failed_count: 1 });
  });

  it('counts a URL missing from the statuses as failed', async () => {
    ok({ body: { results: [{ id: 'https://a.com', url: 'https://a.com', text: 'x' }] } });
    const result = await runAction({ action: exaGetContentsAction, propsValue: { urls: ['https://a.com', 'https://b.com'] } });
    expect(result).toMatchObject({ failed_count: 1, statuses: [] });
  });

  it('refuses a request that asks for no content before calling Exa', async () => {
    await expect(runAction({ action: exaGetContentsAction, propsValue: { urls: ['https://a.com'], includeText: false } })).rejects.toThrow(
      /Choose at least one thing to return/,
    );
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('refuses more than 100 URLs before calling Exa', async () => {
    const urls = Array.from({ length: 101 }, (_, index) => `https://a.com/${index}`);
    await expect(runAction({ action: exaGetContentsAction, propsValue: { urls } })).rejects.toThrow(/at most 100 URLs/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('returns outgoing links per page', async () => {
    ok({ body: { results: [{ id: 'https://a.com', url: 'https://a.com', extras: { links: ['https://a.com/x', 'https://a.com/y'] } }], statuses: [] } });
    const result = await runAction({ action: exaGetContentsAction, propsValue: { urls: ['https://a.com'], linksPerPage: 2 } });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(lastRequest().body.extras).toEqual({ links: 2 });
    expect(result).toMatchObject({ results: [{ url: 'https://a.com', links: ['https://a.com/x', 'https://a.com/y'] }] });
  });
});

describe('exa_answer', () => {
  it('returns citations', async () => {
    ok({ body: { answer: 'yes', citations: [{ id: 'c', title: 'C', url: 'https://c.com' }], costDollars: { total: 0.005 } } });
    const result = await runAction({ action: exaAnswerAction, propsValue: { query: 'q' } });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(lastRequest().body).toEqual({ query: 'q', model: 'exa', text: false });
    expect(result).toMatchObject({ answer: 'yes', citations: [{ id: 'c', title: 'C', url: 'https://c.com' }], cost_total: 0.005 });
  });

  it('returns a null answer, not the text "null", when Exa sends none', async () => {
    ok({ body: { citations: [] } });
    const result = await runAction({ action: exaAnswerAction, propsValue: { query: 'q' } });
    expect(result).toMatchObject({ answer: null, citations: [] });
  });

  it('refuses an unknown model before calling Exa', async () => {
    await expect(runAction({ action: exaAnswerAction, propsValue: { query: 'q', model: 'gpt-4' } })).rejects.toThrow(
      /Model must be one of/,
    );
    expect(sendRequest).not.toHaveBeenCalled();
  });
});
