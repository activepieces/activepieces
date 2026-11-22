import { describe, expect, it, vi, afterEach } from 'vitest';
import { HttpError, httpClient } from '@activepieces/pieces-common';
import { braveApi, braveNormalize, BraveSearchApiError } from '../src/lib/common/client';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('buildQuery', () => {
  it('omits empty, null and undefined values and stringifies the rest', () => {
    expect(braveApi.buildQuery({ q: ' cats ', count: 5, offset: undefined, country: null, lang: '  ', extra_snippets: true })).toEqual({
      q: 'cats',
      count: '5',
      extra_snippets: 'true',
    });
  });
  it('keeps zero', () => {
    expect(braveApi.buildQuery({ offset: 0 })).toEqual({ offset: '0' });
  });
});

describe('resolveInteger', () => {
  it('returns the default for empty input', () => {
    expect(braveApi.resolveInteger({ value: undefined, label: 'Count', min: 1, max: 20, defaultValue: 10 })).toBe(10);
    expect(braveApi.resolveInteger({ value: null, label: 'Count', min: 1, max: 20 })).toBeUndefined();
  });
  it.each([
    { value: 21, max: 20 },
    { value: 0, max: 20 },
    { value: 10, max: 9 },
    { value: 1.5, max: 20 },
    { value: 201, max: 200 },
  ])('rejects $value with max $max', ({ value, max }) => {
    expect(() => braveApi.resolveInteger({ value, label: 'Count', min: max === 9 ? 0 : 1, max })).toThrow(/whole number/);
  });
  it('accepts the bounds', () => {
    expect(braveApi.resolveInteger({ value: 20, label: 'Count', min: 1, max: 20 })).toBe(20);
    expect(braveApi.resolveInteger({ value: 0, label: 'Offset', min: 0, max: 9 })).toBe(0);
  });
});

describe('validateQuery', () => {
  it('rejects empty queries', () => {
    expect(() => braveApi.validateQuery({ query: '  ', maxChars: 400, maxWords: 50 })).toThrow(/empty/);
  });
  it('rejects too many characters', () => {
    expect(() => braveApi.validateQuery({ query: 'a'.repeat(401), maxChars: 400, maxWords: 50 })).toThrow(/400 characters/);
    expect(braveApi.validateQuery({ query: 'a'.repeat(600), maxChars: 600, maxWords: 75 })).toHaveLength(600);
  });
  it('rejects too many words', () => {
    const words = Array.from({ length: 51 }, () => 'w').join(' ');
    expect(() => braveApi.validateQuery({ query: words, maxChars: 400, maxWords: 50 })).toThrow(/50 words/);
  });
});

describe('resolveFreshness and resolveChoice', () => {
  it('prefers a valid custom range', () => {
    expect(braveApi.resolveFreshness({ preset: 'pd', customRange: '2024-01-01to2024-03-31' })).toBe('2024-01-01to2024-03-31');
    expect(braveApi.resolveFreshness({ preset: 'pw', customRange: '' })).toBe('pw');
    expect(braveApi.resolveFreshness({ preset: undefined, customRange: undefined })).toBeUndefined();
  });
  it('rejects malformed values', () => {
    expect(() => braveApi.resolveFreshness({ preset: undefined, customRange: '2024-01-01' })).toThrow(/YYYY-MM-DD/);
    expect(() => braveApi.resolveFreshness({ preset: 'week', customRange: undefined })).toThrow(/pd, pw/);
  });
  it('rejects moderate for images', () => {
    expect(() => braveApi.resolveChoice({ value: 'moderate', allowed: ['off', 'strict'], label: 'Safe Search' })).toThrow(/off, strict/);
    expect(braveApi.resolveChoice({ value: undefined, allowed: ['off', 'strict'], label: 'Safe Search', defaultValue: 'strict' })).toBe('strict');
  });
});

describe('get', () => {
  it('maps 429 to a readable error that keeps the vendor body in responseBody', async () => {
    const body = { error: { code: 'RATE_LIMITED', detail: 'Request rate limit exceeded' } };
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({}, { status: 429, responseBody: body }),
    );
    const error = await braveApi
      .get({ apiKey: 'k', path: '/web/search', query: { q: 'x' }, operation: 'web search' })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BraveSearchApiError);
    expect(error instanceof BraveSearchApiError && error.message).toMatch(/^Brave Search web search failed: rate limit.*Request rate limit exceeded/);
    expect(error instanceof BraveSearchApiError && error.responseBody).toEqual(body);
    expect(error).not.toHaveProperty('body');
  });
  it('maps the 422 invalid-key response to the key message', async () => {
    const body = { error: { code: 'SUBSCRIPTION_TOKEN_INVALID', detail: 'The provided API key is invalid.' } };
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 422, responseBody: body }));
    await expect(braveApi.get({ apiKey: 'k', path: '/web/search', query: { q: 'x' }, operation: 'web search' })).rejects.toThrow(
      /the API key is invalid or revoked/,
    );
  });
  it('maps network errors', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('ETIMEDOUT'));
    await expect(braveApi.get({ apiKey: 'k', path: '/news/search', query: {}, operation: 'news search' })).rejects.toThrow(
      /Brave Search news search failed: could not reach.*ETIMEDOUT/,
    );
  });
  it('sends the key header, Accept and query', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: { ok: true } });
    await braveApi.get({ apiKey: ' key ', path: '/images/search', query: { q: 'x' }, operation: 'image search' });
    const request = spy.mock.calls[0][0];
    expect(request.url).toBe('https://api.search.brave.com/res/v1/images/search');
    expect(request.headers).toEqual({ 'X-Subscription-Token': 'key', Accept: 'application/json' });
    expect(request.queryParams).toEqual({ q: 'x' });
  });
});

describe('normalizers', () => {
  it('normalizes web results', () => {
    const out = braveNormalize.web({
      type: 'search',
      query: { original: 'brave serch', altered: 'brave search', more_results_available: true },
      web: { results: [{ title: 'Brave', url: 'https://brave.com', description: 'd', age: '2 days ago', extra_snippets: ['a'], profile: {} }] },
    });
    expect(out).toEqual({
      query: 'brave search',
      more_results_available: true,
      results: [{ title: 'Brave', url: 'https://brave.com', description: 'd', age: '2 days ago', extra_snippets: ['a'] }],
    });
  });
  it('handles an empty web body', () => {
    expect(braveNormalize.web({})).toEqual({ query: '', more_results_available: false, results: [] });
  });
  it('normalizes news results', () => {
    const out = braveNormalize.news({
      type: 'news',
      query: { original: 'x', more_results_available: false },
      results: [{ title: 'T', url: 'https://n.com/a', description: 'D', age: '1 hour ago', page_age: '2026-11-18T10:00:00', meta_url: { hostname: 'n.com' }, breaking: true, thumbnail: { src: 'https://img' } }],
    });
    expect(out.results[0]).toEqual({
      title: 'T', url: 'https://n.com/a', description: 'D', age: '1 hour ago', page_age: '2026-11-18T10:00:00',
      source: 'n.com', breaking: true, thumbnail_url: 'https://img', extra_snippets: [],
    });
  });
  it('normalizes image results', () => {
    const out = braveNormalize.images({
      type: 'images',
      extra: { might_be_offensive: false },
      results: [{ title: 'Cat', url: 'https://p.com', source: 'p.com', confidence: 'high', thumbnail: { src: 'https://t' }, properties: { url: 'https://i.jpg', width: 800, height: 600 } }],
    });
    expect(out).toEqual({
      count: 1,
      might_be_offensive: false,
      results: [{ title: 'Cat', url: 'https://p.com', source: 'p.com', image_url: 'https://i.jpg', thumbnail_url: 'https://t', width: 800, height: 600, confidence: 'high' }],
    });
  });
  it('normalizes video results', () => {
    const out = braveNormalize.videos({
      query: { more_results_available: true },
      results: [{ title: 'V', url: 'https://y.com/v', description: 'D', age: 'May 1', video: { duration: '01:02', creator: 'C', publisher: 'YouTube' }, thumbnail: { src: 'https://t' } }],
    });
    expect(out).toEqual({
      more_results_available: true,
      results: [{ title: 'V', url: 'https://y.com/v', description: 'D', age: 'May 1', duration: '01:02', creator: 'C', publisher: 'YouTube', thumbnail_url: 'https://t' }],
    });
  });
  it('flattens llm context with sources and keeps JSON snippets as strings', () => {
    const out = braveNormalize.llmContext({
      grounding: { generic: [{ url: 'https://a.com', title: 'A', snippets: ['text', '{"k":1}'] }], map: [] },
      sources: { 'https://a.com': { title: 'A', hostname: 'a.com', age: ['Monday', '2026-11-16', '2 days ago'] } },
    });
    expect(out).toEqual({
      results: [{ url: 'https://a.com', title: 'A', hostname: 'a.com', age: ['Monday', '2026-11-16', '2 days ago'], snippets: ['text', '{"k":1}'] }],
    });
  });
});
