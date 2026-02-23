import { createAction, Property, InputPropertyMap } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { valyuAuth } from '../../index';

export const createDeepResearchTaskAction = createAction({
  name: 'create_deep_research_task',
  displayName: 'Create Deep Research Task',
  description: 'Create an asynchronous deep research task that searches multiple sources and generates detailed reports.',
  auth: valyuAuth,
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description: 'Research query or task description.',
      required: true,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      description: 'Research depth and duration.',
      required: false,
      defaultValue: 'standard',
      options: {
        options: [
          { label: 'Fast (~2-5 min)', value: 'fast' },
          { label: 'Standard (~10-20 min)', value: 'standard' },
          { label: 'Heavy (~90 min)', value: 'heavy' },
        ],
      },
    }),
    output_format: Property.StaticDropdown({
      displayName: 'Output Format',
      description: 'Format for the research output.',
      required: false,
      defaultValue: 'markdown',
      options: {
        options: [
          { label: 'Markdown', value: 'markdown' },
          { label: 'Markdown + PDF', value: 'markdown_pdf' },
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
              description: 'JSON schema for structured output.',
              required: false,
            }),
          };
        }
        return {};
      },
    }),
    strategy: Property.LongText({
      displayName: 'Strategy',
      description: 'Natural language strategy instructions (e.g., "Focus on peer-reviewed sources").',
      required: false,
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
        ],
      },
    }),
    included_sources: Property.StaticMultiSelectDropdown({
      displayName: 'Included Sources',
      description: 'Restrict search to specific source types.',
      required: false,
      options: {
        options: [
          { label: 'Web', value: 'web' },
          { label: 'Academic', value: 'academic' },
          { label: 'Finance', value: 'finance' },
          { label: 'Patent', value: 'patent' },
          { label: 'Transportation', value: 'transportation' },
          { label: 'Politics', value: 'politics' },
          { label: 'Legal', value: 'legal' },
        ],
      },
    }),
    excluded_sources: Property.StaticMultiSelectDropdown({
      displayName: 'Excluded Sources',
      description: 'Exclude specific source types from search.',
      required: false,
      options: {
        options: [
          { label: 'Web', value: 'web' },
          { label: 'Academic', value: 'academic' },
          { label: 'Finance', value: 'finance' },
          { label: 'Patent', value: 'patent' },
          { label: 'Transportation', value: 'transportation' },
          { label: 'Politics', value: 'politics' },
          { label: 'Legal', value: 'legal' },
        ],
      },
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'Filter content published on or after this date (YYYY-MM-DD).',
      required: false,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'Filter content published on or before this date (YYYY-MM-DD).',
      required: false,
    }),
    urls: Property.Array({
      displayName: 'URLs',
      description: 'URLs to extract content from (max 10).',
      required: false,
    }),
    code_execution: Property.Checkbox({
      displayName: 'Code Execution',
      description: 'Enable code execution during research.',
      required: false,
      defaultValue: true,
    }),
    previous_reports: Property.Array({
      displayName: 'Previous Report IDs',
      description: 'Previous deep research IDs to use as context (max 3).',
      required: false,
    }),
    webhook_url: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'HTTPS URL for completion notifications.',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth;

    const body: Record<string, unknown> = {
      query: context.propsValue.query,
    };

    if (context.propsValue.mode) {
      body['mode'] = context.propsValue.mode;
    }

    const outputFormat = context.propsValue.output_format;
    const structuredOptions = context.propsValue.structuredOptions as Record<string, unknown> | undefined;
    if (outputFormat === 'markdown') {
      body['output_formats'] = ['markdown'];
    } else if (outputFormat === 'markdown_pdf') {
      body['output_formats'] = ['markdown', 'pdf'];
    } else if (outputFormat === 'structured' && structuredOptions?.['json_schema']) {
      try {
        body['output_formats'] = [JSON.parse(structuredOptions['json_schema'] as string)];
      } catch {
        throw new Error('Invalid JSON schema provided');
      }
    }

    if (context.propsValue.strategy) {
      body['strategy'] = context.propsValue.strategy;
    }

    const search: Record<string, unknown> = {};
    if (context.propsValue.search_type) {
      search['search_type'] = context.propsValue.search_type;
    }
    if (context.propsValue.included_sources && context.propsValue.included_sources.length > 0) {
      search['included_sources'] = context.propsValue.included_sources;
    }
    if (context.propsValue.excluded_sources && context.propsValue.excluded_sources.length > 0) {
      search['excluded_sources'] = context.propsValue.excluded_sources;
    }
    if (context.propsValue.start_date) {
      search['start_date'] = context.propsValue.start_date;
    }
    if (context.propsValue.end_date) {
      search['end_date'] = context.propsValue.end_date;
    }
    if (Object.keys(search).length > 0) {
      body['search'] = search;
    }

    if (context.propsValue.urls && context.propsValue.urls.length > 0) {
      body['urls'] = context.propsValue.urls;
    }

    if (context.propsValue.code_execution !== undefined) {
      body['code_execution'] = context.propsValue.code_execution;
    }

    if (context.propsValue.previous_reports && context.propsValue.previous_reports.length > 0) {
      body['previous_reports'] = context.propsValue.previous_reports;
    }

    if (context.propsValue.webhook_url) {
      body['webhook_url'] = context.propsValue.webhook_url;
    }

    const response = await makeRequest(apiKey as unknown as string, HttpMethod.POST, '/v1/deepresearch/tasks', body);
    return response;
  },
});
