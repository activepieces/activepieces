import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';
import { exaSharedFields } from './output-schemas';

const twinPageFields: OutputSchemaField[] = [
  ...exaSharedFields.flatResultFields,
  { key: 'links', label: 'Links on Page' },
  {
    key: 'subpages',
    label: 'Subpages',
    labelKey: 'url',
    listItems: exaSharedFields.flatResultFields,
  },
];

const costField: OutputSchemaField = {
  key: 'cost_total',
  label: 'Cost (USD)',
  format: 'currency',
  currency: 'USD',
};

export const exaSearchOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'results',
      label: 'Results',
      labelKey: 'title',
      listItems: exaSharedFields.flatResultFields,
    },
    { key: 'count', label: 'Result Count', format: 'number' },
    costField,
  ],
};

export const exaGetContentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'results',
      label: 'Pages',
      labelKey: 'url',
      listItems: twinPageFields,
    },
    {
      key: 'statuses',
      label: 'Per-URL Status',
      labelKey: 'url',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'status', label: 'Status' },
        { key: 'source', label: 'Source' },
        { key: 'error_tag', label: 'Error' },
        { key: 'error_http_status', label: 'HTTP Status', format: 'number' },
      ],
    },
    { key: 'failed_count', label: 'Failed URLs', format: 'number' },
    costField,
  ],
};

export const exaAnswerOutputSchema: OutputSchema = {
  fields: [
    { key: 'answer', label: 'Answer' },
    {
      key: 'citations',
      label: 'Citations',
      labelKey: 'title',
      listItems: [
        { key: 'title', label: 'Title' },
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'published_date', label: 'Published Date', format: 'date' },
        { key: 'author', label: 'Author' },
        { key: 'text', label: 'Page Text' },
        { key: 'id', label: 'Document ID' },
      ],
    },
    costField,
  ],
};
