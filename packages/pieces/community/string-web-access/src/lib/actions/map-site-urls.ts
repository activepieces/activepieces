import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { stringWebAccessAuth } from '../auth';
import { describeRequestError, makeRequest } from '../common';

const POLLING_INTERVAL_MS = 5000;
const TERMINAL_STATUSES = ['completed', 'failed', 'canceled', 'token_cap_exceeded'];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mapSiteUrls = createAction({
  auth: stringWebAccessAuth,
  name: 'map_site_urls',
  displayName: 'Map Site URLs',
  description: "Crawl a site within a spend cap and return the URLs it discovered.",
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Discovers the URLs on one website, starting from a URL and following same-domain links breadth-first. The job is quoted first and only runs inside the spend cap you set, so it cannot run up an unbounded bill. Use to build a worklist before fetching pages; use Fetch URL to read one page and Search Web to find a starting point. Read-only against the site, but it costs money per page crawled, so avoid repeating it needlessly.',
    idempotent: true,
  },
  props: {
    url: Property.ShortText({
      displayName: 'Start URL',
      description: 'Where the crawl starts. It stays on this hostname.',
      required: true,
    }),
    budgetUsd: Property.Number({
      displayName: 'Budget (USD)',
      description:
        'Hard spend cap for this crawl. The job stops rather than exceeding it. Required here so a scenario can never approve an open-ended bill.',
      required: true,
      defaultValue: 1,
    }),
    maxPages: Property.Number({
      displayName: 'Max Pages',
      description: 'Maximum pages to crawl, 1-10000.',
      required: false,
      defaultValue: 100,
    }),
    maxDepth: Property.Number({
      displayName: 'Max Depth',
      description: 'Maximum link depth from the start URL, 1-100.',
      required: false,
      defaultValue: 2,
    }),
    pathPrefix: Property.ShortText({
      displayName: 'Path Prefix',
      description: 'Only crawl URLs whose path starts with this, for example `/docs`.',
      required: false,
    }),
    useSitemap: Property.Checkbox({
      displayName: 'Seed From sitemap.xml',
      description: "Also seed from the site's root sitemap.xml. Costs one extra page and finds pages links miss.",
      required: false,
      defaultValue: false,
    }),
    maxWaitSeconds: Property.Number({
      displayName: 'Max Wait (seconds)',
      description:
        'How long to wait for the crawl before returning. If the crawl is still running, the job ID is returned so a later step can collect the URLs.',
      required: false,
      defaultValue: 300,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const apiKey = auth.secret_text;

    const submitBody: Record<string, unknown> = {
      url: propsValue.url,
      budgetUsd: propsValue.budgetUsd,
    };
    if (propsValue.maxPages) submitBody['maxPages'] = propsValue.maxPages;
    if (propsValue.maxDepth) submitBody['maxDepth'] = propsValue.maxDepth;
    if (propsValue.pathPrefix) submitBody['pathPrefix'] = propsValue.pathPrefix;
    if (propsValue.useSitemap) submitBody['useSitemap'] = true;

    try {
      const quote = (await makeRequest(apiKey, HttpMethod.POST, '/sitemap', submitBody)) as {
        jobId: string;
        estimatedCostUsd: string;
        estimatedPages: number;
      };

      await makeRequest(apiKey, HttpMethod.POST, `/sitemap/${quote.jobId}/approve`);

      const deadline = Date.now() + (propsValue.maxWaitSeconds ?? 300) * 1000;
      let status = 'running';

      while (Date.now() < deadline) {
        await sleep(POLLING_INTERVAL_MS);
        const state = (await makeRequest(apiKey, HttpMethod.GET, `/sitemap/${quote.jobId}`)) as {
          status: string;
        };
        status = state.status;

        if (status === 'partial_state') {
          await makeRequest(apiKey, HttpMethod.POST, `/sitemap/${quote.jobId}/approve`);
          continue;
        }
        if (TERMINAL_STATUSES.includes(status)) break;
      }

      if (!TERMINAL_STATUSES.includes(status)) {
        return {
          jobId: quote.jobId,
          status,
          estimatedCostUsd: quote.estimatedCostUsd,
          estimatedPages: quote.estimatedPages,
          urls: [],
          note: 'The crawl was still running when Max Wait elapsed. Collect the URLs later with this job ID.',
        };
      }

      const results = (await makeRequest(apiKey, HttpMethod.GET, `/sitemap/${quote.jobId}/urls`, undefined, {
        limit: '1000',
        offset: '0',
      })) as { total: number; urls: unknown[] };

      return {
        jobId: quote.jobId,
        status,
        estimatedCostUsd: quote.estimatedCostUsd,
        estimatedPages: quote.estimatedPages,
        total: results.total,
        urls: results.urls,
      };
    } catch (error: any) {
      throw describeRequestError(error, 'The site could not be mapped.');
    }
  },
});
