import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const resultFields: OutputSchemaField[] = [
  { key: 'title', label: 'Title' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'publishedDate', label: 'Published Date', format: 'date' },
  { key: 'score', label: 'Relevance Score', format: 'number' },
  { key: 'text', label: 'Page Text' },
  { key: 'highlights', label: 'Highlights' },
  { key: 'prunedContext', label: 'Pruned Context' },
  { key: 'language', label: 'Language' },
  { key: 'id', label: 'Document ID' },
];

const costField: OutputSchemaField = {
  key: 'costDollars',
  label: 'Cost',
  children: [{ key: 'total', label: 'Total (USD)', format: 'number' }],
};

export const searchOutputSchema: OutputSchema = {
  fields: [
    { key: 'results', label: 'Results', labelKey: 'title', listItems: resultFields },
    costField,
    { key: 'requestId', label: 'Request ID' },
  ],
};

export const contentsOutputSchema: OutputSchema = {
  fields: [
    { key: 'results', label: 'Pages', labelKey: 'title', listItems: resultFields },
    {
      key: 'statuses',
      label: 'Statuses',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'URL', format: 'url' },
        { key: 'status', label: 'Status' },
        { key: 'error', label: 'Error', children: [{ key: 'message', label: 'Message' }, { key: 'tag', label: 'Tag' }] },
      ],
    },
    costField,
    { key: 'requestId', label: 'Request ID' },
  ],
};
