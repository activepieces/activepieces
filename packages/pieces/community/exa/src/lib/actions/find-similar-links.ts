import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { exaAuth } from '../auth';
import { similarLinksOutputSchema } from '../output-schemas';

export const findSimilarLinksAction = createAction({
  name: 'find_similar_links',
  classification: 'SEARCH',
  displayName: 'Find Similar Links',
  description: 'Find pages similar to a given URL.',
  audience: 'human',
  aiMetadata: {
    description: 'Finds web pages semantically similar to a single reference URL via Exa. Use when an agent has one example page and wants more of the same kind rather than searching by a text query; results can be narrowed by domain include/exclude lists, crawl/publish date ranges, and required/forbidden text. Requires a reference URL. Read-only and idempotent.',
    idempotent: true,
  },
  auth: exaAuth,
  outputSchema: similarLinksOutputSchema,
  propertyGroups: [
    { key: 'source', display: 'section', label: 'Reference Page', icon: 'file', props: ['url', 'numResults'] },
    { key: 'filters', display: 'section', label: 'Filters', icon: 'filter', props: ['includeDomains', 'excludeDomains', 'startPublishedDate', 'endPublishedDate', 'includeText', 'excludeText'] },
  ],
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The page to find similar pages for.',
      placeholder: 'https://example.com/blog/post',
      required: true,
    }),
    numResults: Property.Number({
      displayName: 'Number of Results',
      description: 'How many results to return, up to 100.',
      required: false,
    }),
    includeDomains: Property.Array({
      displayName: 'Include Domains',
      description: 'Only return results from these domains.',
      width: 'half',
      required: false,
    }),
    excludeDomains: Property.Array({
      displayName: 'Exclude Domains',
      description: 'Never return results from these domains.',
      width: 'half',
      required: false,
    }),
    startCrawlDate: Property.DateTime({
      displayName: 'Start Crawl Date',
      description: 'Exa now ignores this filter. Use the published dates instead.',
      advanced: true,
      required: false,
    }),
    endCrawlDate: Property.DateTime({
      displayName: 'End Crawl Date',
      description: 'Exa now ignores this filter. Use the published dates instead.',
      advanced: true,
      required: false,
    }),
    startPublishedDate: Property.DateTime({
      displayName: 'Start Published Date',
      description: 'Only results published after this date.',
      width: 'half',
      required: false,
    }),
    endPublishedDate: Property.DateTime({
      displayName: 'End Published Date',
      description: 'Only results published before this date.',
      width: 'half',
      required: false,
    }),
    includeText: Property.Array({
      displayName: 'Include Text',
      description: 'Results must contain this phrase of up to 5 words.',
      width: 'half',
      required: false,
    }),
    excludeText: Property.Array({
      displayName: 'Exclude Text',
      description: 'Results must not contain this phrase of up to 5 words.',
      width: 'half',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;

    const {
      url,
      numResults,
      includeDomains,
      excludeDomains,
      startCrawlDate,
      endCrawlDate,
      startPublishedDate,
      endPublishedDate,
      includeText,
      excludeText,
    } = context.propsValue;

    const body: Record<string, unknown> = {
      url,
    };

    if (numResults !== undefined) body['numResults'] = numResults;
    if (includeDomains) body['includeDomains'] = includeDomains;
    if (excludeDomains) body['excludeDomains'] = excludeDomains;
    if (startCrawlDate) body['startCrawlDate'] = startCrawlDate;
    if (endCrawlDate) body['endCrawlDate'] = endCrawlDate;
    if (startPublishedDate) body['startPublishedDate'] = startPublishedDate;
    if (endPublishedDate) body['endPublishedDate'] = endPublishedDate;
    if (includeText) body['includeText'] = includeText;
    if (excludeText) body['excludeText'] = excludeText;

    const response =  await makeRequest(apiKey, HttpMethod.POST, '/findSimilar', body) as  {results:Record<string,any>[]};
    return response.results;
  },
});
