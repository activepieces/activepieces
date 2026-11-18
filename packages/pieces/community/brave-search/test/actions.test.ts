import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, AppConnectionValueForAuthProperty, InputPropertyMap, StaticPropsValue } from '@activepieces/pieces-framework';
import { createMockActionContext } from '../../../framework/src/lib/test';
import { braveSearch } from '../src';
import { braveSearchAuth } from '../src/lib/auth';
import { aiSearchWebAction } from '../src/lib/actions/ai-search-web';
import { braveWebSearchAction } from '../src/lib/actions/web-search';
import { searchNewsAction } from '../src/lib/actions/search-news';
import { searchImagesAction } from '../src/lib/actions/search-images';
import { searchVideosAction } from '../src/lib/actions/search-videos';
import { getLlmContextAction } from '../src/lib/actions/get-llm-context';

const auth: AppConnectionValueForAuthProperty<typeof braveSearchAuth> = {
  type: AppConnectionType.SECRET_TEXT,
  secret_text: 'test-key',
};

afterEach(() => {
  vi.restoreAllMocks();
});

function context<Props extends InputPropertyMap>({ propsValue }: { propsValue: StaticPropsValue<Props> }) {
  return { ...createMockActionContext<Props>({ propsValue }), auth };
}

function mockBrave() {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: {} });
}

function lastRequest(spy: ReturnType<typeof mockBrave>) {
  return spy.mock.calls[spy.mock.calls.length - 1][0];
}

describe('piece', () => {
  it('registers every search action', () => {
    expect(Object.keys(braveSearch.actions()).sort()).toEqual(
      ['ai_search_web', 'custom_api_call', 'get_llm_context', 'search_images', 'search_news', 'search_videos', 'web_search'].sort(),
    );
  });
});

describe('action requests', () => {
  it('Search the Web sends GET /web/search with result_filter, moderate safesearch and no extra_snippets by default', async () => {
    const spy = mockBrave();
    await aiSearchWebAction.run(context<typeof aiSearchWebAction.props>({ propsValue: { query: 'cats', extra_snippets: false } }));
    const request = lastRequest(spy);
    expect(request.method).toBe(HttpMethod.GET);
    expect(request.url).toBe('https://api.search.brave.com/res/v1/web/search');
    expect(request.queryParams).toMatchObject({ q: 'cats', result_filter: 'web,query', safesearch: 'moderate' });
    expect(request.queryParams).not.toHaveProperty('extra_snippets');
  });

  it('Search the Web sends extra_snippets only when it is on', async () => {
    const spy = mockBrave();
    await aiSearchWebAction.run(context<typeof aiSearchWebAction.props>({ propsValue: { query: 'cats', extra_snippets: true } }));
    expect(lastRequest(spy).queryParams).toMatchObject({ extra_snippets: 'true' });
  });

  it('Web Search sends GET /web/search with the count and filters', async () => {
    const spy = mockBrave();
    await braveWebSearchAction.run(
      context<typeof braveWebSearchAction.props>({ propsValue: { query: 'cats', count: 5, offset: 1, country: 'DE', freshness: 'pw' } }),
    );
    const request = lastRequest(spy);
    expect(request.method).toBe(HttpMethod.GET);
    expect(request.url).toBe('https://api.search.brave.com/res/v1/web/search');
    expect(request.queryParams).toMatchObject({ q: 'cats', count: '5', offset: '1', country: 'DE', freshness: 'pw' });
  });

  it('Search News sends GET /news/search with strict safesearch by default', async () => {
    const spy = mockBrave();
    await searchNewsAction.run(context<typeof searchNewsAction.props>({ propsValue: { query: 'ai' } }));
    const request = lastRequest(spy);
    expect(request.method).toBe(HttpMethod.GET);
    expect(request.url).toBe('https://api.search.brave.com/res/v1/news/search');
    expect(request.queryParams).toMatchObject({ q: 'ai', safesearch: 'strict' });
  });

  it('Search Images sends GET /images/search with strict safesearch and no offset', async () => {
    const spy = mockBrave();
    await searchImagesAction.run(context<typeof searchImagesAction.props>({ propsValue: { query: 'lake', count: 5 } }));
    const request = lastRequest(spy);
    expect(request.method).toBe(HttpMethod.GET);
    expect(request.url).toBe('https://api.search.brave.com/res/v1/images/search');
    expect(request.queryParams).toMatchObject({ q: 'lake', count: '5', safesearch: 'strict' });
    expect(request.queryParams).not.toHaveProperty('offset');
  });

  it('Search Images rejects moderate safesearch before calling Brave', async () => {
    const spy = mockBrave();
    await expect(
      searchImagesAction.run(context<typeof searchImagesAction.props>({ propsValue: { query: 'lake', safesearch: 'moderate' } })),
    ).rejects.toThrow(/off, strict/);
    expect(spy).not.toHaveBeenCalled();
  });

  it('Search Videos sends GET /videos/search with moderate safesearch by default', async () => {
    const spy = mockBrave();
    await searchVideosAction.run(context<typeof searchVideosAction.props>({ propsValue: { query: 'tutorial' } }));
    const request = lastRequest(spy);
    expect(request.method).toBe(HttpMethod.GET);
    expect(request.url).toBe('https://api.search.brave.com/res/v1/videos/search');
    expect(request.queryParams).toMatchObject({ q: 'tutorial', safesearch: 'moderate' });
  });

  it('Get LLM Context sends GET /llm/context with the token and URL limits', async () => {
    const spy = mockBrave();
    await getLlmContextAction.run(
      context<typeof getLlmContextAction.props>({
        propsValue: {
          query: 'webhooks',
          maximum_number_of_urls: 3,
          maximum_number_of_tokens: 1024,
          maximum_number_of_tokens_per_url: 512,
          context_threshold_mode: 'strict',
        },
      }),
    );
    const request = lastRequest(spy);
    expect(request.method).toBe(HttpMethod.GET);
    expect(request.url).toBe('https://api.search.brave.com/res/v1/llm/context');
    expect(request.queryParams).toMatchObject({
      q: 'webhooks',
      maximum_number_of_urls: '3',
      maximum_number_of_tokens: '1024',
      maximum_number_of_tokens_per_url: '512',
      context_threshold_mode: 'strict',
    });
  });

  it('Get LLM Context rejects a token limit below 1024 before calling Brave', async () => {
    const spy = mockBrave();
    await expect(
      getLlmContextAction.run(context<typeof getLlmContextAction.props>({ propsValue: { query: 'webhooks', maximum_number_of_tokens: 100 } })),
    ).rejects.toThrow();
    expect(spy).not.toHaveBeenCalled();
  });
});
