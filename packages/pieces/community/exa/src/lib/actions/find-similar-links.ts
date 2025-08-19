import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { exaAuth } from '../../index';

export const findSimilarLinksAction = createAction({
  name: 'find_similar_links',
  displayName: 'Find Similar Links',
  description: 'Find pages similar to a given URL.',
  auth: exaAuth,
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'Reference URL to find semantically similar links.',
      required: true,
    }),
    numResults: Property.Number({
      displayName: 'Number of Results',
      description: 'Number of results to return (max 100).',
      required: false,
    }),
    includeDomains: Property.Array({
      displayName: 'Include Domains',
      description: 'List of domains to include in results.',
      required: false,
    }),
    excludeDomains: Property.Array({
      displayName: 'Exclude Domains',
      description: 'List of domains to exclude from results.',
      required: false,
    }),
    startCrawlDate: Property.DateTime({
      displayName: 'Start Crawl Date (ISO)',
      description: 'Include links crawled after this date (ISO format).',
      required: false,
    }),
    endCrawlDate: Property.DateTime({
      displayName: 'End Crawl Date (ISO)',
      description: 'Include links crawled before this date (ISO format).',
      required: false,
    }),
    startPublishedDate: Property.DateTime({
      displayName: 'Start Published Date (ISO)',
      description: 'Only include links published after this date (ISO format).',
      required: false,
    }),
    endPublishedDate: Property.DateTime({
      displayName: 'End Published Date (ISO)',
      description: 'Only include links published before this date (ISO format).',
      required: false,
    }),
    includeText: Property.Array({
      displayName: 'Include Text',
      description: 'Strings that must be present in the webpage text (max 1 string of up to 5 words).',
      required: false,
    }),
    excludeText: Property.Array({
      displayName: 'Exclude Text',
      description: 'Strings that must not be present in the webpage text (max 1 string of up to 5 words).',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;

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
