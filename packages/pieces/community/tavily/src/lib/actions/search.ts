import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { tavilyAuth } from '../auth';
import { searchOutputSchema } from '../output-schemas';

export const searchAction = createAction({
  name: 'search',
  outputSchema: searchOutputSchema,
  classification: 'SEARCH',
  displayName: 'Search',
  description: 'Search for data based on a query.',
  audience: 'both',
  aiMetadata: { description: 'Run a web search through the Tavily search engine for a natural-language query and return relevant results; tune scope with search depth, a general vs. news topic, recency windows, and domain include/exclude lists, and optionally include images, raw page content, or an LLM-generated answer summary. Use to look up current or external information from the web. Read-only and idempotent: the same query returns equivalent results without side effects, though live web data may shift over time.', idempotent: true },
  auth: tavilyAuth,
  propertyGroups: [
    { key: 'search', display: 'section', label: 'Search', icon: 'text', props: ['query', 'search_depth', 'topic'] },
    { key: 'time', display: 'section', label: 'Time Window', icon: 'calendar', props: ['time_range', 'days'] },
    { key: 'results', display: 'section', label: 'Results', icon: 'sliders', props: ['max_results', 'include_answer', 'include_raw_content', 'include_images'] },
    { key: 'domains', display: 'section', label: 'Domains', icon: 'filter', props: ['include_domains', 'exclude_domains'] },
  ],
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description: 'What to search the web for, in plain words.',
      placeholder: 'Latest news on EU AI rules',
      required: true,
    }),
    search_depth: Property.StaticDropdown({
      displayName: 'Search Depth',
      description: 'Advanced is more relevant, uses 2 credits.',
      required: false,
      defaultValue: 'basic',
      width: 'half',
      options: {
        options: [
          { label: 'Basic', value: 'basic' },
          { label: 'Advanced', value: 'advanced' },
        ],
      },
    }),
    topic: Property.StaticDropdown({
      displayName: 'Topic',
      description: 'News covers recent news articles.',
      required: false,
      defaultValue: 'general',
      width: 'half',
      options: {
        options: [
          { label: 'General', value: 'general' },
          { label: 'News', value: 'news' },
        ],
      },
    }),
    time_range: Property.StaticDropdown({
      displayName: 'Time Range',
      description: 'Only results published in this window.',
      required: false,
      width: 'half',
      options: {
        options: [
          { label: 'Day', value: 'day' },
          { label: 'Week', value: 'week' },
          { label: 'Month', value: 'month' },
          { label: 'Year', value: 'year' },
          { label: 'Day (Short)', value: 'd' },
          { label: 'Week (Short)', value: 'w' },
          { label: 'Month (Short)', value: 'm' },
          { label: 'Year (Short)', value: 'y' },
        ],
      },
    }),
    days: Property.Number({
      displayName: 'Days',
      description: 'Days back to search. News topic only.',
      required: false,
      defaultValue: 3,
      width: 'half',
    }),
    max_results: Property.Number({
      displayName: 'Maximum Results',
      description: 'Number of results to return, from 0 to 20.',
      required: false,
      defaultValue: 5,
      display: 'stepper',
      min: 0,
      max: 20,
      step: 1,
    }),
    include_answer: Property.Checkbox({
      displayName: 'Include AI Answer',
      description: 'Add a short AI-written answer based on the results.',
      required: false,
      defaultValue: false,
    }),
    include_raw_content: Property.Checkbox({
      displayName: 'Include Page Content',
      description: 'Add the cleaned text of each result page.',
      required: false,
      defaultValue: false,
    }),
    include_images: Property.Checkbox({
      displayName: 'Include Images',
      description: 'Add images related to the query.',
      required: false,
      defaultValue: false,
      reveals: ['include_image_descriptions'],
    }),
    include_image_descriptions: Property.Checkbox({
      displayName: 'Include Image Descriptions',
      description: 'Add a short description to each image.',
      required: false,
      defaultValue: false,
    }),
    include_domains: Property.Array({
      displayName: 'Include Domains',
      description: 'Only return results from these domains.',
      required: false,
    }),
    exclude_domains: Property.Array({
      displayName: 'Exclude Domains',
      description: 'Never return results from these domains.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.tavily.com/search',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text
      },
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        query: propsValue.query,
        search_depth: propsValue.search_depth,
        topic: propsValue.topic,
        days: propsValue.days,
        time_range: propsValue.time_range,
        max_results: propsValue.max_results,
        include_images: propsValue.include_images,
        include_image_descriptions: propsValue.include_image_descriptions,
        include_answer: propsValue.include_answer,
        include_raw_content: propsValue.include_raw_content,
        include_domains: propsValue.include_domains,
        exclude_domains: propsValue.exclude_domains,
      },
    });

    return response.body;
  },
}); 