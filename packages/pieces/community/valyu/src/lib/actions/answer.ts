import { createAction, Property, InputPropertyMap } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { valyuAuth } from '../../index';

export const answerAction = createAction({
  name: 'answer',
  displayName: 'Answer Query',
  description: 'Get AI-generated answers using search results. Combines web/proprietary search with AI processing.',
  auth: valyuAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'The question or topic to get an AI-generated answer for.',
      required: true,
    }),
    system_instructions: Property.LongText({
      displayName: 'System Instructions',
      description: 'Custom instructions for AI processing (up to 2000 characters).',
      required: false,
    }),
    output_format: Property.StaticDropdown({
      displayName: 'Output Format',
      description: 'Choose the format for the AI response.',
      required: false,
      defaultValue: 'unstructured',
      options: {
        options: [
          { label: 'Unstructured Text', value: 'unstructured' },
          { label: 'Structured JSON', value: 'structured' },
        ],
      },
    }),
    structuredOptions: Property.DynamicProperties({
      displayName: 'Structured Output Options',
      required: false,
      refreshers: ['output_format'],
      auth: valyuAuth,
      props: async (propsValue): Promise<InputPropertyMap> => {
        const outputFormat = propsValue['output_format'] as unknown as string;
        if (outputFormat === 'structured') {
          return {
            json_schema: Property.LongText({
              displayName: 'JSON Schema',
              description: 'JSON schema for structured output (see json-schema.org).',
              required: false,
            }),
          };
        }
        return {};
      },
    }),
    search_type: Property.StaticDropdown({
      displayName: 'Search Type',
      description: 'Type of search to perform.',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Web', value: 'web' },
          { label: 'Proprietary', value: 'proprietary' },
          { label: 'News', value: 'news' },
        ],
      },
    }),
    fast_mode: Property.Checkbox({
      displayName: 'Fast Mode',
      description: 'Enable fast mode for reduced latency but shorter results.',
      required: false,
      defaultValue: false,
    }),
    data_max_price: Property.Number({
      displayName: 'Data Max Price',
      description: 'Maximum price in dollars for data retrieval (search costs only).',
      required: false,
      defaultValue: 1,
    }),
    included_sources: Property.Array({
      displayName: 'Included Sources',
      description: 'Specific sources to search (URLs, domains or dataset names).',
      required: false,
    }),
    excluded_sources: Property.Array({
      displayName: 'Excluded Sources',
      description: 'Specific sources to exclude from search.',
      required: false,
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'Start date filter for search results (YYYY-MM-DD).',
      required: false,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'End date filter for search results (YYYY-MM-DD).',
      required: false,
    }),
    country_code: Property.ShortText({
      displayName: 'Country Code',
      description: '2-letter ISO country code to bias search results (e.g., US, GB).',
      required: false,
    }),
    streaming: Property.Checkbox({
      displayName: 'Streaming',
      description: 'Enable SSE streaming. Returns search results first, then content deltas.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth;

    const body: Record<string, unknown> = {
      query: context.propsValue.query,
    };

    const optionalProps = [
      'system_instructions',
      'search_type',
      'fast_mode',
      'data_max_price',
      'included_sources',
      'excluded_sources',
      'start_date',
      'end_date',
      'country_code',
      'streaming',
    ];

    for (const prop of optionalProps) {
      const val = context.propsValue[prop as keyof typeof context.propsValue];
      if (val !== undefined && val !== null && val !== '') {
        body[prop] = val;
      }
    }

    const structuredOptions = context.propsValue.structuredOptions as Record<string, unknown> | undefined;
    if (context.propsValue.output_format === 'structured' && structuredOptions?.['json_schema']) {
      try {
        body['structured_output'] = JSON.parse(structuredOptions['json_schema'] as string);
      } catch {
        throw new Error('Invalid JSON schema provided');
      }
    }

    const response = await makeRequest(apiKey as unknown as string, HttpMethod.POST, '/v1/answer', body);
    return response;
  },
});
