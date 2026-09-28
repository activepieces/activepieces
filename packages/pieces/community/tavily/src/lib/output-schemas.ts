import { OutputSchema } from '@activepieces/pieces-framework';

export const tavilyCrawlWebsiteOutputSchema: OutputSchema = {
  fields: [
    { key: 'base_url', label: 'Base URL', format: 'url' },
    {
      key: 'results',
      label: 'Results',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'raw_content', label: 'Raw Content' },
      ],
    },
    { key: 'response_time', label: 'Response Time', format: 'number' },
    { key: 'request_id', label: 'Request ID' },
  ],
};

export const extractOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'results',
      label: 'Results',
      labelKey: 'title',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'title', label: 'Title' },
        { key: 'raw_content', label: 'Raw Content' },
        { key: 'images', label: 'Images' },
      ],
    },
    {
      key: 'failed_results',
      label: 'Failed Results',
      labelKey: 'url',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'error', label: 'Error' },
      ],
    },
    { key: 'response_time', label: 'Response Time', format: 'number' },
    { key: 'request_id', label: 'Request ID' },
  ],
};

export const tavilyGetResearchTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'content', label: 'Content' },
    {
      key: 'sources',
      label: 'Sources',
      labelKey: 'title',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'title', label: 'Title' },
        { key: 'favicon', label: 'Favicon', format: 'url' },
      ],
    },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'response_time', label: 'Response Time', format: 'number' },
    { key: 'request_id', label: 'Request ID' },
  ],
};

export const tavilyMapWebsiteOutputSchema: OutputSchema = {
  fields: [
    { key: 'base_url', label: 'Base URL', format: 'url' },
    { key: 'results', label: 'Results' },
    { key: 'response_time', label: 'Response Time', format: 'number' },
    { key: 'request_id', label: 'Request ID' },
  ],
};

export const searchOutputSchema: OutputSchema = {
  fields: [
    { key: 'query', label: 'Query' },
    { key: 'follow_up_questions', label: 'Follow Up Questions' },
    { key: 'answer', label: 'Answer' },
    { key: 'images', label: 'Images' },
    {
      key: 'results',
      label: 'Results',
      labelKey: 'title',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'title', label: 'Title' },
        { key: 'content', label: 'Content' },
        { key: 'score', label: 'Score', format: 'number' },
        { key: 'raw_content', label: 'Raw Content' },
        { key: 'id', label: 'ID' },
      ],
    },
    { key: 'response_time', label: 'Response Time', format: 'number' },
    { key: 'request_id', label: 'Request ID' },
  ],
};

export const tavilyStartResearchTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'Status' },
    { key: 'input', label: 'Input' },
    { key: 'model', label: 'Model' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'response_time', label: 'Response Time', format: 'number' },
    { key: 'request_id', label: 'Request ID' },
  ],
};

export const tavilyGetUsageOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'key',
      label: 'Key',
      children: [
        { key: 'usage', label: 'Usage', format: 'number' },
        { key: 'limit', label: 'Limit', format: 'number' },
        { key: 'search_usage', label: 'Search Usage', format: 'number' },
        { key: 'crawl_usage', label: 'Crawl Usage', format: 'number' },
        { key: 'extract_usage', label: 'Extract Usage', format: 'number' },
        { key: 'map_usage', label: 'Map Usage', format: 'number' },
        { key: 'research_usage', label: 'Research Usage', format: 'number' },
      ],
    },
    {
      key: 'account',
      label: 'Account',
      children: [
        { key: 'current_plan', label: 'Current Plan' },
        { key: 'plan_usage', label: 'Plan Usage', format: 'number' },
        { key: 'plan_limit', label: 'Plan Limit', format: 'number' },
        { key: 'search_usage', label: 'Search Usage', format: 'number' },
        { key: 'crawl_usage', label: 'Crawl Usage', format: 'number' },
        { key: 'extract_usage', label: 'Extract Usage', format: 'number' },
        { key: 'map_usage', label: 'Map Usage', format: 'number' },
        { key: 'research_usage', label: 'Research Usage', format: 'number' },
        { key: 'paygo_usage', label: 'Paygo Usage', format: 'number' },
        { key: 'paygo_limit', label: 'Paygo Limit', format: 'number' },
      ],
    },
  ],
};
