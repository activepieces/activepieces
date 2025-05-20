import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { exaAuth } from '../../index';

export const performSearchAction = createAction({
  name: 'perform_search',
  displayName: 'Perform Search',
  description: "Search the web using semantic or keyword-based search.",
  auth: exaAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Search query to find related articles and data.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Search Type',
      description: 'Type of search to perform.',
      required: false,
      defaultValue: 'auto',
      options: {
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Keyword', value: 'keyword' },
          { label: 'Neural', value: 'neural' },
        ],
      },
    }),
    category: Property.StaticDropdown({
      displayName: 'Category',
      description: 'Category of data to focus the search on.',
      required: false,
      options: {
        options: [
          { label: 'Company', value: 'company' },
          { label: 'Research Paper', value: 'research paper' },
          { label: 'News', value: 'news' },
          { label: 'PDF', value: 'pdf' },
          { label: 'GitHub', value: 'github' },
          { label: 'Tweet', value: 'tweet' },
          { label: 'Personal Site', value: 'personal site' },
          { label: 'LinkedIn Profile', value: 'linkedin profile' },
          { label: 'Financial Report', value: 'financial report' },
        ],
      },
    }),
    numResults: Property.Number({
      displayName: 'Number of Results',
      description: 'Number of results to return (max 100).',
      required: false,
      defaultValue: 10,
    }),
    includeDomains: Property.Array({
      displayName: 'Include Domains',
      description: 'Limit results to only these domains.',
      required: false,
    }),
    excludeDomains: Property.Array({
      displayName: 'Exclude Domains',
      description: 'Exclude results from these domains.',
      required: false,
    }),
    startCrawlDate: Property.DateTime({
      displayName: 'Start Crawl Date',
      description: 'Only include results crawled after this ISO date.',
      required: false,
    }),
    endCrawlDate: Property.DateTime({
      displayName: 'End Crawl Date',
      description: 'Only include results crawled before this ISO date.',
      required: false,
    }),
    startPublishedDate: Property.DateTime({
      displayName: 'Start Published Date',
      description: 'Only include results published after this ISO date.',
      required: false,
    }),
    endPublishedDate: Property.DateTime({
      displayName: 'End Published Date',
      description: 'Only include results published before this ISO date.',
      required: false,
    }),
    includeText: Property.Array({
      displayName: 'Include Text',
      description: 'Strings that must be present in the text of results.',
      required: false,
    }),
    excludeText: Property.Array({
      displayName: 'Exclude Text',
      description: 'Strings that must not be present in the text of results.',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;

    const body: Record<string, unknown> = {
      query: context.propsValue.query,
       contents:{
        text:true
       }
    };

    const optionalProps = [
      'type', 'category', 'numResults', 'includeDomains', 'excludeDomains',
      'startCrawlDate', 'endCrawlDate', 'startPublishedDate', 'endPublishedDate',
      'includeText', 'excludeText',
    ];

    for (const prop of optionalProps) {
      const val = context.propsValue[prop as keyof typeof context.propsValue];
      if (val !== undefined && val !== null && val !== '') {
        body[prop] = val;
      }
    }

    const response =  await makeRequest(apiKey, HttpMethod.POST, '/search', body) as {results:Record<string,any>[]};
    return response.results;
  },
});
