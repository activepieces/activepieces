import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const personFields: OutputSchemaField[] = [
  { key: 'id', label: 'Person ID', description: 'PostHog person UUID. Use it with Delete Person.' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'distinctIds', label: 'Distinct IDs', description: 'Every distinct ID linked to this person.' },
  { key: 'properties', label: 'Properties', dynamicKey: true },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
];

const flagFields: OutputSchemaField[] = [
  { key: 'id', label: 'Flag ID', format: 'number' },
  { key: 'key', label: 'Key' },
  { key: 'name', label: 'Description' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'deleted', label: 'Deleted', format: 'boolean' },
  { key: 'rolloutPercentage', label: 'Rollout %', format: 'number', description: 'Rollout of the first release condition; null when the flag uses several conditions or variants.' },
  { key: 'filters', label: 'Filters (raw)' },
  { key: 'tags', label: 'Tags' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  { key: 'createdBy', label: 'Created By (email)', format: 'email' },
  { key: 'url', label: 'URL', format: 'url' },
];

const annotationFields: OutputSchemaField[] = [
  { key: 'id', label: 'Annotation ID', format: 'number' },
  { key: 'content', label: 'Content' },
  { key: 'dateMarker', label: 'Date', format: 'datetime' },
  { key: 'scope', label: 'Scope' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
];

function page({ itemsLabel, labelKey, items }: { itemsLabel: string; labelKey: string; items: OutputSchemaField[] }): OutputSchema {
  return {
    fields: [
      { key: 'items', label: itemsLabel, labelKey, listItems: items },
      { key: 'count', label: 'Returned', format: 'number' },
      { key: 'hasMore', label: 'Has More', format: 'boolean' },
      { key: 'nextOffset', label: 'Next Offset', format: 'number', description: 'Pass as offset to get the next page; null when there is none.' },
    ],
  };
}

export const posthogOutputSchemas = {
  captured: {
    fields: [
      { key: 'uuid', label: 'Event UUID', description: 'Send again with this UUID to retry without creating a duplicate.' },
      { key: 'event', label: 'Event' },
      { key: 'distinctId', label: 'Distinct ID' },
      { key: 'timestamp', label: 'Timestamp', format: 'datetime' },
      { key: 'status', label: 'Ingestion Status' },
    ],
  } satisfies OutputSchema,
  legacyPersons: {
    itemLabel: '{email}',
    fields: [
      { key: 'id', label: 'ID' },
      { key: 'uuid', label: 'UUID' },
      { key: 'distinct_ids', label: 'Distinct IDs (comma separated)' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
      { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    ],
  } satisfies OutputSchema,
  legacyFlags: {
    itemLabel: '{key}',
    fields: [
      { key: 'id', label: 'ID', format: 'number' },
      { key: 'name', label: 'Description' },
      { key: 'key', label: 'Key' },
      { key: 'active', label: 'Active', format: 'boolean' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
      { key: 'updated_at', label: 'Updated At', format: 'datetime' },
      { key: 'tags', label: 'Tags (comma separated)' },
      { key: 'created_by_email', label: 'Created By Email', format: 'email' },
      { key: 'created_by_name', label: 'Created By Name' },
    ],
  } satisfies OutputSchema,
  project: {
    fields: [
      { key: 'id', label: 'Project ID', format: 'number' },
      { key: 'uuid', label: 'UUID' },
      { key: 'name', label: 'Name' },
      { key: 'api_token', label: 'Project API Key', description: 'Public token used by PostHog SDKs to send events.' },
      { key: 'organization', label: 'Organization ID' },
      { key: 'timezone', label: 'Timezone' },
      { key: 'anonymize_ips', label: 'Anonymize IPs', format: 'boolean' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
      { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    ],
  } satisfies OutputSchema,
  query: {
    fields: [
      { key: 'columns', label: 'Columns' },
      { key: 'types', label: 'Column Types' },
      { key: 'rows', label: 'Rows', description: 'One object per result row, keyed by column name.' },
      { key: 'rowCount', label: 'Row Count', format: 'number' },
      { key: 'hasMore', label: 'Has More', format: 'boolean', description: 'True when PostHog cut the result at the LIMIT; add LIMIT/OFFSET to page.' },
    ],
  } satisfies OutputSchema,
  person: { fields: [{ key: 'found', label: 'Found', format: 'boolean' }, ...personFields] } satisfies OutputSchema,
  personUpdated: {
    fields: [
      { key: 'distinctId', label: 'Distinct ID' },
      { key: 'uuid', label: 'Event UUID' },
      { key: 'set', label: 'Set Properties', dynamicKey: true },
      { key: 'setOnce', label: 'Set-Once Properties', dynamicKey: true },
      { key: 'unset', label: 'Removed Properties' },
      { key: 'status', label: 'Ingestion Status' },
    ],
  } satisfies OutputSchema,
  deleted: {
    fields: [
      { key: 'id', label: 'ID' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
    ],
  } satisfies OutputSchema,
  flag: { fields: flagFields } satisfies OutputSchema,
  flagEvaluation: {
    fields: [
      { key: 'distinctId', label: 'Distinct ID' },
      { key: 'flags', label: 'Flags', labelKey: 'key', listItems: [
        { key: 'key', label: 'Key' },
        { key: 'enabled', label: 'Enabled', format: 'boolean' },
        { key: 'variant', label: 'Variant' },
        { key: 'reason', label: 'Reason' },
        { key: 'payload', label: 'Payload' },
      ] },
      { key: 'errorsWhileComputingFlags', label: 'Errors While Computing', format: 'boolean' },
    ],
  } satisfies OutputSchema,
  cohorts: page({ itemsLabel: 'Cohorts', labelKey: 'name', items: [
    { key: 'id', label: 'Cohort ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'count', label: 'Persons', format: 'number' },
    { key: 'isStatic', label: 'Static', format: 'boolean' },
    { key: 'isCalculating', label: 'Calculating', format: 'boolean' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
  ] }),
  insights: page({ itemsLabel: 'Insights', labelKey: 'name', items: [
    { key: 'id', label: 'Insight ID', format: 'number' },
    { key: 'shortId', label: 'Short ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'favorited', label: 'Favorited', format: 'boolean' },
    { key: 'lastModifiedAt', label: 'Last Modified', format: 'datetime' },
    { key: 'url', label: 'URL', format: 'url' },
  ] }),
  dashboards: page({ itemsLabel: 'Dashboards', labelKey: 'name', items: [
    { key: 'id', label: 'Dashboard ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'pinned', label: 'Pinned', format: 'boolean' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'url', label: 'URL', format: 'url' },
  ] }),
  eventDefinitions: page({ itemsLabel: 'Event Definitions', labelKey: 'name', items: [
    { key: 'id', label: 'Definition ID' },
    { key: 'name', label: 'Event Name' },
    { key: 'description', label: 'Description' },
    { key: 'lastSeenAt', label: 'Last Seen', format: 'datetime' },
    { key: 'verified', label: 'Verified', format: 'boolean' },
  ] }),
  annotation: { fields: annotationFields } satisfies OutputSchema,
  newEvent: {
    fields: [
      { key: 'id', label: 'Event UUID' },
      { key: 'event', label: 'Event' },
      { key: 'distinct_id', label: 'Distinct ID' },
      { key: 'timestamp', label: 'Timestamp', format: 'datetime' },
      { key: 'properties', label: 'Properties', dynamicKey: true },
    ],
  } satisfies OutputSchema,
};
