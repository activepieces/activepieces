import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { contextfetchAuth } from '../auth';
import { contextfetchApi } from '../common/client';
import { searchOutputSchema } from '../output-schemas';

export const searchAction = createAction({
  name: 'search',
  displayName: 'Search',
  description: 'Search the web and get results with page Markdown, highlights or pruned context.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Run a web search with ContextFetch for a natural-language query and return ranked results (title, URL, published date) with optional page content: the full page as Markdown, the most relevant highlights, or a pruned context of only the passages relevant to the query. Narrow results with include/exclude domain lists and a published-after date. Use to look up current or external information from the web. Read-only and idempotent; costs 1 credit per call.',
    idempotent: true,
  },
  auth: contextfetchAuth,
  outputSchema: searchOutputSchema,
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description: 'What to search the web for (up to 2,000 characters), e.g. "best vector database 2026".',
      required: true,
    }),
    numResults: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of results to return (1 to 25).',
      required: false,
      defaultValue: 5,
    }),
    contents: Property.StaticMultiSelectDropdown({
      displayName: 'Page Content',
      description:
        'What page content to add to each result. Full Text is the whole page as Markdown, Highlights are the page chunks most relevant to the query, Pruned Context is those chunks joined in page order to save tokens. With none, results have only title, URL and score.',
      required: false,
      defaultValue: ['prunedContext'],
      options: {
        options: [
          { label: 'Full Text', value: 'text' },
          { label: 'Highlights', value: 'highlights' },
          { label: 'Pruned Context', value: 'prunedContext' },
        ],
      },
    }),
    includeDomains: Property.Array({
      displayName: 'Include Domains',
      description: 'Only return results from these domains, e.g. docs.python.org.',
      required: false,
    }),
    excludeDomains: Property.Array({
      displayName: 'Exclude Domains',
      description: 'Leave results from these domains out, e.g. pinterest.com.',
      required: false,
    }),
    startPublishedDate: Property.DateTime({
      displayName: 'Published After',
      description: 'Only return results published on or after this date.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const contents = propsValue.contents ?? [];
    const body: Record<string, unknown> = {
      query: propsValue.query,
      numResults: propsValue.numResults ?? 5,
      contents: {
        text: contents.includes('text'),
        highlights: contents.includes('highlights'),
        prunedContext: contents.includes('prunedContext'),
      },
    };
    const includeDomains = stringList(propsValue.includeDomains);
    const excludeDomains = stringList(propsValue.excludeDomains);
    if (includeDomains.length > 0) body['includeDomains'] = includeDomains;
    if (excludeDomains.length > 0) body['excludeDomains'] = excludeDomains;
    if (propsValue.startPublishedDate) body['startPublishedDate'] = propsValue.startPublishedDate;

    return contextfetchApi.request<Record<string, unknown>>({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/search',
      body,
    });
  },
});

function stringList(values: unknown[] | undefined): string[] {
  return (values ?? []).map((v) => String(v).trim()).filter((v) => v.length > 0);
}
