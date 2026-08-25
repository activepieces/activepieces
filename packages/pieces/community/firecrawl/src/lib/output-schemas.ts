import { OutputSchema } from '@activepieces/pieces-framework';

const scrapeResultFields: OutputSchema['fields'] = [
  { key: 'markdown', label: 'Markdown' },
  { key: 'html', label: 'HTML', format: 'html' },
  { key: 'rawHtml', label: 'Raw HTML', format: 'html' },
  { key: 'links', label: 'Links' },
  { key: 'summary', label: 'Summary' },
  {
    key: 'screenshot',
    label: 'Screenshot',
    children: [
      { key: 'fileName', label: 'File Name' },
      { key: 'fileUrl', label: 'File URL', format: 'url' },
    ],
  },
  {
    key: 'metadata',
    label: 'Metadata',
    children: [
      { key: 'title', label: 'Title' },
      { key: 'language', label: 'Language' },
      { key: 'sourceURL', label: 'Source URL', format: 'url' },
      { key: 'url', label: 'Final URL', format: 'url' },
      { key: 'statusCode', label: 'Status Code', format: 'number' },
      { key: 'favicon', label: 'Favicon', format: 'image' },
      { key: 'creditsUsed', label: 'Credits Used', format: 'number' },
    ],
  },
];

export const scrapeUrlActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'data', label: 'Data', children: scrapeResultFields },
  ],
};

const jobResultFields: OutputSchema['fields'] = [
  { key: 'success', label: 'Success', format: 'boolean' },
  { key: 'status', label: 'Status' },
  { key: 'completed', label: 'Completed', format: 'number' },
  { key: 'total', label: 'Total', format: 'number' },
  { key: 'creditsUsed', label: 'Credits Used', format: 'number' },
  { key: 'expiresAt', label: 'Expires At', format: 'datetime' },
  { key: 'next', label: 'Next Page URL', format: 'url' },
  { key: 'data', label: 'Pages', listItems: scrapeResultFields },
];

export const crawlWebsiteActionOutputSchema: OutputSchema = {
  fields: jobResultFields,
};

export const getCrawlResultsActionOutputSchema: OutputSchema = {
  fields: jobResultFields,
};

export const getBatchScrapeResultsActionOutputSchema: OutputSchema = {
  fields: [
    ...jobResultFields,
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'completedAt', label: 'Completed At', format: 'datetime' },
    { key: 'duration', label: 'Duration (ms)', format: 'number' },
  ],
};

const jobErrorFields: OutputSchema['fields'] = [
  {
    key: 'errors',
    label: 'Errors',
    labelKey: 'url',
    listItems: [
      { key: 'id', label: 'ID' },
      { key: 'url', label: 'URL', format: 'url' },
      { key: 'code', label: 'Error Code' },
      { key: 'error', label: 'Error Message' },
      { key: 'timestamp', label: 'Timestamp', format: 'datetime' },
    ],
  },
  { key: 'robotsBlocked', label: 'Robots-Blocked URLs' },
];

export const getCrawlErrorsActionOutputSchema: OutputSchema = {
  fields: jobErrorFields,
};

export const getBatchScrapeErrorsActionOutputSchema: OutputSchema = {
  fields: jobErrorFields,
};

export const cancelCrawlActionOutputSchema: OutputSchema = {
  fields: [{ key: 'status', label: 'Status' }],
};

export const cancelBatchScrapeActionOutputSchema: OutputSchema = cancelCrawlActionOutputSchema;

export const batchScrapeActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'id', label: 'Job ID' },
    { key: 'url', label: 'Status URL', format: 'url' },
    { key: 'invalidURLs', label: 'Invalid URLs' },
  ],
};

export const mapWebsiteActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'links', label: 'Links' },
  ],
};

export const searchWebActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'web',
          label: 'Web Results',
          labelKey: 'title',
          listItems: [
            { key: 'url', label: 'URL', format: 'url' },
            { key: 'title', label: 'Title' },
            { key: 'description', label: 'Description' },
            { key: 'position', label: 'Position', format: 'number' },
          ],
        },
      ],
    },
    { key: 'creditsUsed', label: 'Credits Used', format: 'number' },
    { key: 'id', label: 'Search ID' },
  ],
};

export const listActiveCrawlsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'crawls',
      label: 'Crawls',
      labelKey: 'url',
      listItems: [
        { key: 'id', label: 'Crawl ID' },
        { key: 'teamId', label: 'Team ID' },
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
      ],
    },
  ],
};

export const extractDataActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'data', label: 'Data' },
    { key: 'status', label: 'Status' },
    { key: 'expiresAt', label: 'Expires At', format: 'datetime' },
    { key: 'tokensUsed', label: 'Tokens Used', format: 'number' },
    { key: 'creditsUsed', label: 'Credits Used', format: 'number' },
    { key: 'warnings', label: 'Warnings' },
  ],
};

export const startAgentActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'id', label: 'Agent Job ID' },
  ],
};

export const getAgentStatusActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'status', label: 'Status' },
    { key: 'data', label: 'Result' },
    { key: 'model', label: 'Model' },
    { key: 'expiresAt', label: 'Expires At', format: 'datetime' },
    { key: 'creditsUsed', label: 'Credits Used', format: 'number' },
  ],
};
