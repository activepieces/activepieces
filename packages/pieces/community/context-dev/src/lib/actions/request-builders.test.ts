import { describe, expect, it } from 'vitest';

import { buildCrawlRequest } from './crawl-website';
import { buildExtractRequest } from './extract-structured-data';
import { buildSitemapQuery } from './find-website-pages';
import { buildBrandRetrieveRequest } from './get-brand-profile';
import { buildScrapeQuery } from './scrape-url';
import { buildSearchRequest } from './search-web';

describe('Context.dev request builders', () => {
  it('builds a web search request with domain and Markdown options', () => {
    expect(
      buildSearchRequest({
        query: 'latest Context.dev updates',
        numResults: 20,
        includeDomains: ['context.dev', '', 42],
        excludeDomains: ['pinterest.com'],
        freshness: 'last_month',
        country: 'us',
        queryFanout: true,
        includeMarkdown: true,
        useMainContentOnly: true,
        includeLinks: true,
        includeImages: false,
        timeoutMs: 60000,
      })
    ).toEqual({
      query: 'latest Context.dev updates',
      numResults: 20,
      includeDomains: ['context.dev'],
      excludeDomains: ['pinterest.com'],
      freshness: 'last_month',
      country: 'us',
      queryFanout: true,
      markdownOptions: {
        enabled: true,
        useMainContentOnly: true,
        includeLinks: true,
        includeImages: false,
      },
      timeoutMS: 60000,
    });
  });

  it('builds scrape query parameters using public API names', () => {
    expect(
      buildScrapeQuery({
        url: 'https://www.context.dev/pricing',
        useMainContentOnly: true,
        includeLinks: true,
        includeImages: false,
        includeHtml: true,
        includeFrames: false,
        includeSelectors: ['main', '#pricing'],
        excludeSelectors: ['nav', 'footer'],
        maxAgeMs: 0,
        waitForMs: 1500,
        country: 'us',
        timeoutMs: 30000,
      })
    ).toEqual({
      url: 'https://www.context.dev/pricing',
      useMainContentOnly: 'true',
      includeLinks: 'true',
      includeImages: 'false',
      includeHTML: 'true',
      includeFrames: 'false',
      includeSelectors: 'main,#pricing',
      excludeSelectors: 'nav,footer',
      maxAgeMs: '0',
      waitForMs: '1500',
      country: 'us',
      timeoutMS: '30000',
    });
  });

  it('builds crawl and sitemap requests without empty optional fields', () => {
    expect(
      buildCrawlRequest({
        url: 'https://docs.context.dev',
        maxPages: 25,
        maxDepth: 2,
        urlRegex: '/docs/.*',
        followSubdomains: false,
        useMainContentOnly: true,
        includeLinks: true,
        includeImages: false,
        maxAgeMs: 86400000,
        stopAfterMs: 45000,
        timeoutMs: 120000,
      })
    ).toEqual({
      url: 'https://docs.context.dev',
      maxPages: 25,
      maxDepth: 2,
      urlRegex: '/docs/.*',
      followSubdomains: false,
      useMainContentOnly: true,
      includeLinks: true,
      includeImages: false,
      maxAgeMs: 86400000,
      waitForMs: undefined,
      stopAfterMs: 45000,
      timeoutMS: 120000,
    });
    expect(
      buildSitemapQuery({
        domain: 'context.dev',
        search: 'API pricing',
        maxLinks: 50,
        timeoutMs: 60000,
      })
    ).toEqual({
      domain: 'context.dev',
      search: 'API pricing',
      maxLinks: '50',
      timeoutMS: '60000',
    });
  });

  it('builds an extraction request from a JSON schema', () => {
    const schema = {
      type: 'object',
      properties: { price: { type: 'string' } },
    };

    expect(
      buildExtractRequest({
        url: 'https://www.context.dev/pricing',
        schema,
        instructions: 'Return displayed prices.',
        maxPages: 3,
        maxDepth: 1,
        followSubdomains: false,
        factCheck: true,
        timeoutMs: 120000,
      })
    ).toEqual({
      url: 'https://www.context.dev/pricing',
      schema,
      instructions: 'Return displayed prices.',
      maxPages: 3,
      maxDepth: 1,
      followSubdomains: false,
      factCheck: true,
      maxAgeMs: undefined,
      waitForMs: undefined,
      timeoutMS: 120000,
    });
  });

  it('builds each brand lookup with only supported fields', () => {
    expect(
      buildBrandRetrieveRequest({
        lookupType: 'domain',
        value: 'stripe.com',
        maximumSpeed: true,
        maxAgeMs: 86400000,
        timeoutMs: 60000,
      })
    ).toEqual({
      type: 'by_domain',
      domain: 'stripe.com',
      maxSpeed: true,
      maxAgeMs: 86400000,
      timeoutMS: 60000,
    });
    expect(
      buildBrandRetrieveRequest({
        lookupType: 'direct_url',
        value: 'https://stripe.com/enterprise',
        maximumSpeed: true,
        maxAgeMs: 86400000,
        timeoutMs: 60000,
      })
    ).toEqual({
      type: 'by_direct_url',
      direct_url: 'https://stripe.com/enterprise',
      timeoutMS: 60000,
    });
    expect(
      buildBrandRetrieveRequest({
        lookupType: 'transaction',
        value: 'STRIPE PAYMENT',
        country: 'us',
        maximumSpeed: false,
        maxAgeMs: 86400000,
        timeoutMs: 60000,
      })
    ).toEqual({
      type: 'by_transaction',
      transaction_info: 'STRIPE PAYMENT',
      country_gl: 'us',
      maxSpeed: false,
      timeoutMS: 60000,
    });
  });
});
