import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const redactedFieldsField: OutputSchemaField = {
  key: 'redacted_fields',
  label: 'Redacted Fields',
  description: 'Response paths Shopify withheld.',
};

const pagingFields: OutputSchema['fields'] = [
  { key: 'count', label: 'Count', format: 'number' },
  { key: 'has_next_page', label: 'Has Next Page', format: 'boolean' },
  {
    key: 'end_cursor',
    label: 'End Cursor',
    description: 'Pass back as the cursor to read the next page.',
  },
  redactedFieldsField,
];

const analyticsTargetFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Analytics Target ID' },
  { key: 'name', label: 'Name' },
  { key: 'metric', label: 'Metric', description: 'ShopifyQL metric identifier, for example total_sales.' },
  { key: 'start_date', label: 'Start Date', format: 'date' },
  { key: 'end_date', label: 'End Date', format: 'date' },
  {
    key: 'expected_value',
    label: 'Expected Value',
    description: 'The goal as an exact decimal string.',
  },
  { key: 'currency_code', label: 'Currency' },
  { key: 'filters', label: 'Filters', description: "ShopifyQL filter expression, for example shipping_country = 'US'." },
  {
    key: 'shopifyql_query',
    label: 'ShopifyQL Query',
    description: 'Generated query that returns the current value of the metric for this target.',
  },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const analyticsAnnotationFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Analytics Annotation ID' },
  { key: 'type', label: 'Type' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'started_at', label: 'Started At', format: 'datetime' },
  {
    key: 'ended_at',
    label: 'Ended At',
    format: 'datetime',
    description: 'Empty for a point-in-time or open-ended annotation.',
  },
  { key: 'source', label: 'Source', description: 'APP for annotations created by this connection.' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

export const analyticsTargetOutputSchema: OutputSchema = {
  fields: [...analyticsTargetFields, redactedFieldsField],
};

export const createAnalyticsTargetOutputSchema: OutputSchema = {
  fields: [
    ...analyticsTargetFields,
    {
      key: 'already_existed',
      label: 'Already Existed',
      format: 'boolean',
      description:
        'True when a target with the same metric, dates and filters already existed; it is returned unchanged.',
    },
    redactedFieldsField,
  ],
};

export const listAnalyticsTargetsOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Analytics Targets', labelKey: 'name', listItems: analyticsTargetFields },
    ...pagingFields,
  ],
};

export const deleteAnalyticsTargetsOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted_ids', label: 'Deleted Target IDs' },
    { key: 'deleted_count', label: 'Deleted Count', format: 'number' },
    {
      key: 'not_deleted_ids',
      label: 'Not Deleted Target IDs',
      description: 'Requested ids Shopify did not delete, usually because they were not found.',
    },
    { key: 'errors', label: 'Errors', description: 'Shopify messages for the ids that were not deleted.' },
    redactedFieldsField,
  ],
};

export const analyticsAnnotationOutputSchema: OutputSchema = {
  fields: [...analyticsAnnotationFields, redactedFieldsField],
};

export const deleteAnalyticsAnnotationOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted_annotation_id', label: 'Deleted Annotation ID' },
    redactedFieldsField,
  ],
};
