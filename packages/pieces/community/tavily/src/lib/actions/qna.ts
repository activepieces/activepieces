import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { tavilyAuth } from '../auth';

export const qnaAction = createAction({
  name: 'qna',
  displayName: 'Direct Q&A Search',
  description: 'Ask Tavily a question and return a direct concise answer with source citations for LLM grounding',
  audience: 'both',
  aiMetadata: {
    description:
      'Submits a natural-language question to Tavily search and returns an explicit direct answer text along with supporting search result references.',
    idempotent: true,
  },
  auth: tavilyAuth,
  props: {
    query: Property.LongText({
      displayName: 'Question',
      description: 'The natural-language question you want Tavily to answer.',
      required: true,
    }),
    search_depth: Property.StaticDropdown({
      displayName: 'Search Depth',
      description: 'The depth of the search (basic or advanced). Advanced provides higher quality answers.',
      required: false,
      defaultValue: 'advanced',
      options: {
        options: [
          { label: 'Basic', value: 'basic' },
          { label: 'Advanced', value: 'advanced' },
        ],
      },
    }),
    topic: Property.StaticDropdown({
      displayName: 'Topic',
      description: 'The category of search agent to use.',
      required: false,
      defaultValue: 'general',
      options: {
        options: [
          { label: 'General', value: 'general' },
          { label: 'News', value: 'news' },
        ],
      },
    }),
    max_results: Property.Number({
      displayName: 'Max Source Results',
      description: 'Number of supporting source links to include (1-10)',
      required: false,
      defaultValue: 5,
    }),
  },
  async run(context) {
    const { query, search_depth, topic, max_results } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.tavily.com/search',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        query,
        include_answer: true,
        search_depth: search_depth ?? 'advanced',
        topic: topic ?? 'general',
        max_results: max_results ?? 5,
      },
    });

    return response.body;
  },
});
