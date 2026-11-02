import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { exaAuth } from '../auth';
import { exaInput } from '../common/client';
import { contentsResultsOutputSchema } from '../output-schemas';

export const getContentsAction = createAction({
  name: 'get_contents',
  classification: 'READ',
  displayName: 'Get Contents',
  description: 'Retrieve clean HTML content from specified URLs.',
  audience: 'human',
  aiMetadata: {
    description: 'Crawls and extracts clean page content (and optionally full text, highlights, a guided summary and outgoing links) from a given list of URLs via Exa. Use when an agent already has specific URLs and needs their on-page content rather than running a web search; optionally fetch matching subpages by keyword and control cache freshness. Requires an array of URLs as input. Read-only and idempotent.',
    idempotent: true,
  },
  auth: exaAuth,
  outputSchema: contentsResultsOutputSchema,
  props: {
    urls: Property.Array({
      displayName: 'URLs',
      required: true,
      description: 'Array of URLs to crawl',
    }),
    text: Property.Checkbox({
      displayName: 'Return Full Text',
      description: 'If true, returns full page text. If false, disables text return.',
      required: false,
      defaultValue: true,
    }),
    livecrawl: Property.StaticDropdown({
      displayName: 'Livecrawl Option',
      description: 'Deprecated by Exa: prefer Max Content Age. Ignored when Max Content Age is set.',
      required: false,
      options: {
        options: [
          { label: 'Never', value: 'never' },
          { label: 'Fallback', value: 'fallback' },
          { label: 'Always', value: 'always' },
          { label: 'Auto', value: 'auto' },
        ],
      },
    }),
    livecrawlTimeout: Property.Number({
      displayName: 'Livecrawl Timeout (ms)',
      description: 'Timeout for livecrawling in milliseconds.',
      required: false,
    }),
    subpages: Property.Number({
      displayName: 'Number of Subpages',
      description: 'Number of subpages to crawl.',
      required: false,
    }),
    subpageTarget: Property.ShortText({
      displayName: 'Subpage Target',
      description: 'Keyword(s) to find specific subpages.',
      required: false,
    }),
    highlights: Property.Checkbox({
      displayName: 'Include Highlights',
      description: 'Also return the most relevant snippets from each page (billed as an extra content type).',
      required: false,
      defaultValue: false,
    }),
    summaryQuery: Property.ShortText({
      displayName: 'Summary Question',
      description: 'Ask for an AI summary of each page focused on this question, e.g. "What does this company sell?" (billed per page).',
      required: false,
    }),
    maxAgeHours: Property.Number({
      displayName: 'Max Content Age (hours)',
      description: 'Use cached content only if it is newer than this many hours (0 always fetches fresh, -1 always uses cache, up to 720). Replaces Livecrawl Option.',
      required: false,
    }),
    extrasLinks: Property.Number({
      displayName: 'Links per Page',
      description: 'Also return up to this many links found on each page, e.g. 10.',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;

    const body: Record<string, unknown> = {
      urls: context.propsValue.urls,
    };

    const maxAgeHours = exaInput.optionalInteger({
      value: context.propsValue.maxAgeHours,
      name: 'Max Content Age (hours)',
      min: -1,
      max: 720,
    });
    const extrasLinks = exaInput.optionalInteger({
      value: context.propsValue.extrasLinks,
      name: 'Links per Page',
      min: 1,
      max: 1000,
    });
    const summaryQuery = exaInput.optionalText(context.propsValue.summaryQuery);

    if (context.propsValue.text !== undefined) body['text'] = context.propsValue.text;
    if (maxAgeHours !== undefined) body['maxAgeHours'] = maxAgeHours;
    else if (context.propsValue.livecrawl) body['livecrawl'] = context.propsValue.livecrawl;
    if (context.propsValue.highlights) body['highlights'] = true;
    if (summaryQuery) body['summary'] = { query: summaryQuery };
    if (extrasLinks !== undefined) body['extras'] = { links: extrasLinks };
    if (context.propsValue.livecrawlTimeout !== undefined) body['livecrawlTimeout'] = context.propsValue.livecrawlTimeout;
    if (context.propsValue.subpages !== undefined) body['subpages'] = context.propsValue.subpages;
    if (context.propsValue.subpageTarget) body['subpageTarget'] = context.propsValue.subpageTarget;


    const response =  await makeRequest(apiKey, HttpMethod.POST, '/contents', body) as {results:Record<string,any>[]};
    return response.results;
  },
});
