/// <reference types="vitest/globals" />

import { AppConnectionType, createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import '../src';
import { scrapeSingleUrl } from '../src/lib/actions/scrape-single-url';

const apify = vi.hoisted(() => ({
  call: vi.fn(),
  listItems: vi.fn(),
}));

vi.mock('apify-client', async (importOriginal) => {
  const original = await importOriginal<typeof import('apify-client')>();
  class FakeApifyClient {
    actor() {
      return { call: apify.call };
    }
    dataset() {
      return { listItems: apify.listItems };
    }
  }
  return { ...original, ApifyClient: FakeApifyClient };
});

describe('scrapeSingleUrl', () => {
  beforeEach(() => {
    apify.call.mockReset();
    apify.listItems.mockReset();
    apify.call.mockResolvedValue({ id: 'run-1', status: 'SUCCEEDED', defaultDatasetId: 'dataset-1' });
    apify.listItems.mockResolvedValue({
      items: [{ url: 'https://example.com/page', markdown: '# Page', html: '<h1>Page</h1>' }],
    });
  });

  test.each(['https://example.com/page', 'http://example.com/page'])('starts a crawler run for %s', async (url) => {
    await expect(runScrape(url)).resolves.toEqual({
      url: 'https://example.com/page',
      markdown: '# Page',
      html: '<h1>Page</h1>',
    });
    expect(apify.call).toHaveBeenCalledTimes(1);
    expect(apify.call).toHaveBeenCalledWith(expect.objectContaining({ startUrls: [{ url }], crawlerType: 'cheerio' }));
  });

  test.each([
    'not a url',
    'example.com/page',
    'ftp://example.com/file.txt',
    'javascript:alert(1)',
    'file:///etc/passwd',
  ])('rejects %s without starting a run', async (url) => {
    await expect(runScrape(url)).rejects.toThrow(
      'Invalid URL format. Please provide a valid URL with http:// or https://',
    );
    expect(apify.call).not.toHaveBeenCalled();
  });
});

function runScrape(url: string): Promise<unknown> {
  const propsValue = { url, crawlerType: 'cheerio' };
  const base = createMockActionContext<InputPropertyMap>({ propsValue });
  return scrapeSingleUrl.run({
    ...base,
    auth: { type: AppConnectionType.CUSTOM_AUTH, props: { apikey: 'test-key' } },
    propsValue,
  });
}
