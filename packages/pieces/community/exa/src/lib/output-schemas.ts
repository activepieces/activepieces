import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const rawLinkFields: OutputSchemaField[] = [
  { key: 'title', label: 'Title' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'publishedDate', label: 'Published Date', format: 'date' },
  { key: 'author', label: 'Author' },
  { key: 'image', label: 'Image', format: 'image' },
  { key: 'id', label: 'Document ID' },
];

const rawSearchFields: OutputSchemaField[] = [
  ...rawLinkFields,
  { key: 'text', label: 'Page Text' },
  { key: 'highlights', label: 'Highlights' },
  { key: 'score', label: 'Relevance Score', format: 'number' },
];

const rawSimilarFields: OutputSchemaField[] = [
  ...rawLinkFields,
  { key: 'score', label: 'Relevance Score', format: 'number' },
];

const rawSubpageFields: OutputSchemaField[] = [
  ...rawLinkFields,
  { key: 'text', label: 'Page Text' },
];

const rawContentsFields: OutputSchemaField[] = [
  ...rawLinkFields,
  { key: 'text', label: 'Page Text' },
  { key: 'highlights', label: 'Highlights' },
  { key: 'summary', label: 'Summary' },
  {
    key: 'extras',
    label: 'Extras',
    children: [{ key: 'links', label: 'Links on Page' }],
  },
  {
    key: 'subpages',
    label: 'Subpages',
    labelKey: 'title',
    listItems: rawSubpageFields,
  },
];

const citationFields: OutputSchemaField[] = [
  { key: 'title', label: 'Title' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'field', label: 'Supports Field' },
  { key: 'confidence', label: 'Confidence' },
];

const agentRunSummaryFields: OutputSchemaField[] = [
  { key: 'id', label: 'Run ID' },
  { key: 'status', label: 'Status' },
  { key: 'stop_reason', label: 'Stop Reason' },
  { key: 'query', label: 'Task' },
  { key: 'effort', label: 'Effort' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'completed_at', label: 'Completed At', format: 'datetime' },
  { key: 'cost_total', label: 'Cost (USD)', format: 'currency', currency: 'USD' },
];

const flatResultFields: OutputSchemaField[] = [
  { key: 'title', label: 'Title' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'published_date', label: 'Published Date', format: 'date' },
  { key: 'author', label: 'Author' },
  { key: 'text', label: 'Page Text' },
  { key: 'highlights', label: 'Highlights' },
  { key: 'summary', label: 'Summary' },
  { key: 'image', label: 'Image', format: 'image' },
  { key: 'id', label: 'Document ID' },
];

export const searchResultsOutputSchema: OutputSchema = {
  itemLabel: '{title}',
  fields: [
    {
      key: 'results',
      label: 'Results',
      value: '',
      labelKey: 'title',
      listItems: rawSearchFields,
    },
  ],
};

export const similarLinksOutputSchema: OutputSchema = {
  itemLabel: '{title}',
  fields: [
    {
      key: 'results',
      label: 'Similar Pages',
      value: '',
      labelKey: 'title',
      listItems: rawSimilarFields,
    },
  ],
};

export const contentsResultsOutputSchema: OutputSchema = {
  itemLabel: '{title}',
  fields: [
    {
      key: 'results',
      label: 'Pages',
      value: '',
      labelKey: 'title',
      listItems: rawContentsFields,
    },
  ],
};

export const agentRunOutputSchema: OutputSchema = {
  fields: [
    ...agentRunSummaryFields,
    { key: 'output_text', label: 'Answer' },
    { key: 'output_structured', label: 'Structured Output' },
    {
      key: 'citations',
      label: 'Citations',
      labelKey: 'title',
      listItems: citationFields,
    },
    { key: 'search_count', label: 'Searches Used', format: 'number' },
    { key: 'agent_compute_units', label: 'Agent Compute Units', format: 'number' },
  ],
};

export const agentRunListOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'runs',
      label: 'Runs',
      labelKey: 'id',
      listItems: agentRunSummaryFields,
    },
    { key: 'count', label: 'Runs in This Page', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const searchMonitorRunOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'Run Status' },
    { key: 'fail_reason', label: 'Fail Reason' },
    {
      key: 'summary',
      label: 'Summary',
      description: "Exa's summary of the results in this payload. Empty when the run also held results that were delivered before; see Run Summary.",
    },
    { key: 'result_count', label: 'New Results', format: 'number' },
    {
      key: 'run_summary',
      label: 'Run Summary',
      description: "Exa's summary of the whole monitor run, which can mention results delivered before. Numbered markers such as [1] are Exa's own and do not reliably index Run Citations.",
    },
    { key: 'run_result_count', label: 'Results in Run', format: 'number' },
    {
      key: 'results',
      label: 'Results',
      labelKey: 'title',
      listItems: flatResultFields,
    },
    {
      key: 'citations',
      label: 'Citations',
      labelKey: 'title',
      description: 'Sources for the results in this payload.',
      listItems: citationFields,
    },
    {
      key: 'run_citations',
      label: 'Run Citations',
      labelKey: 'title',
      description: 'Every source Exa cited for the whole run, in Exa\'s order.',
      listItems: citationFields,
    },
    { key: 'run_id', label: 'Run ID' },
    { key: 'monitor_id', label: 'Monitor ID' },
    { key: 'event_id', label: 'Event ID' },
    { key: 'event_created_at', label: 'Delivered At', format: 'datetime' },
  ],
};
export const exaSharedFields = { flatResultFields };
