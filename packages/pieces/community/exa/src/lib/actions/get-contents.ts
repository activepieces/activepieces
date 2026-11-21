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
  description: 'Get the text, highlights and summaries of web pages from their URLs.',
  audience: 'human',
  aiMetadata: {
    description: 'Crawls and extracts clean page content (and optionally full text, highlights, a guided summary and outgoing links) from a given list of URLs via Exa. Use when an agent already has specific URLs and needs their on-page content rather than running a web search; optionally fetch matching subpages by keyword and control cache freshness. Requires an array of URLs as input. Read-only and idempotent.',
    idempotent: true,
  },
  auth: exaAuth,
  outputSchema: contentsResultsOutputSchema,
  propertyGroups: [
    { key: 'pages', display: 'section', label: 'Pages', icon: 'file', props: ['urls', 'text'] },
    { key: 'content', display: 'section', label: 'Page Content', icon: 'text', props: ['highlights', 'summaryQuery', 'maxAgeHours', 'extrasLinks'] },
    { key: 'subpages', display: 'section', label: 'Subpages', icon: 'paperclip', props: ['subpages', 'subpageTarget'] },
  ],
  props: {
    urls: Property.Array({
      displayName: 'URLs',
      required: true,
      description: 'The web pages to read, one URL per item.',
    }),
    text: Property.Checkbox({
      displayName: 'Return Full Text',
      description: 'Turn off to get only highlights, summaries or links.',
      required: false,
      defaultValue: true,
    }),
    livecrawl: Property.StaticDropdown({
      displayName: 'Livecrawl',
      description: 'Deprecated by Exa. Ignored when Max Content Age is set.',
      required: false,
      advanced: true,
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
      displayName: 'Livecrawl Timeout',
      description: 'Milliseconds to wait for a live crawl.',
      required: false,
      advanced: true,
    }),
    subpages: Property.Number({
      displayName: 'Number of Subpages',
      description: 'Also read this many linked pages from each URL.',
      required: false,
      width: 'half',
    }),
    subpageTarget: Property.ShortText({
      displayName: 'Subpage Target',
      description: 'Keyword that picks which subpages to read.',
      placeholder: 'pricing',
      required: false,
      width: 'half',
    }),
    highlights: Property.Checkbox({
      displayName: 'Include Highlights',
      description: 'Also return the most relevant snippets from each page.',
      required: false,
      defaultValue: false,
    }),
    summaryQuery: Property.ShortText({
      displayName: 'Summary Question',
      description: 'Ask for an AI summary of each page, billed per page.',
      placeholder: 'What does this company sell?',
      required: false,
    }),
    maxAgeHours: Property.Number({
      displayName: 'Max Content Age',
      description: 'Max cache age in hours, up to 720. 0: always fresh, -1: always cached.',
      required: false,
      width: 'half',
    }),
    extrasLinks: Property.Number({
      displayName: 'Links per Page',
      description: 'Also return up to this many links from each page.',
      required: false,
      width: 'half',
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
