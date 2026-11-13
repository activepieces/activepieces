import { createAction, OutputSchema, OutputSchemaField, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { posthogMappers } from '../../common/mappers';

const { recordOf, str, num, arrayOf } = posthogClient;

function statusOf(r: Record<string, unknown>): string {
  const status = str(r['status']);
  if (status) return status;
  if (str(r['end_date'])) return 'complete';
  if (str(r['start_date'])) return 'running';
  return 'draft';
}

function experimentSummary(raw: unknown) {
  const r = recordOf(raw);
  return {
    id: num(r['id']),
    name: str(r['name']),
    description: str(r['description']),
    status: statusOf(r),
    featureFlagKey: str(r['feature_flag_key']),
    metricCount: arrayOf(r['metrics']).length,
    archived: r['archived'] === true,
    startDate: str(r['start_date']),
    endDate: str(r['end_date']),
    createdAt: str(r['created_at']),
  };
}

const experimentFields: OutputSchemaField[] = [
  { key: 'id', label: 'Experiment ID', format: 'number', description: 'Use it with Get Experiment Results.' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status', description: 'draft, running or stopped/complete.' },
  { key: 'featureFlagKey', label: 'Feature Flag Key' },
  { key: 'metricCount', label: 'Primary Metrics', format: 'number' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'startDate', label: 'Start Date', format: 'datetime' },
  { key: 'endDate', label: 'End Date', format: 'datetime' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
];

const experimentsSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Experiments', labelKey: 'name', listItems: experimentFields },
    { key: 'count', label: 'Returned', format: 'number' },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
    { key: 'nextOffset', label: 'Next Offset', format: 'number', description: 'Pass as offset to get the next page; null when there is none.' },
  ],
};

export const listExperiments = createAction({
  auth: posthogAuth,
  name: 'list_experiments',
  classification: 'SEARCH',
  displayName: 'List Experiments',
  description: 'List A/B test experiments in the project.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists PostHog experiments (A/B tests) in the project. Returns numeric id (use with Get Experiment Results), name, status (draft, running, stopped), featureFlagKey, metricCount, archived and dates, plus hasMore/nextOffset for paging (limit 1-100). Read-only.',
    idempotent: true,
  },
  outputSchema: experimentsSchema,
  props: {
    limit: Property.Number({ displayName: 'Limit', description: '1-100, default 50', required: false, defaultValue: 50 }),
    offset: Property.Number({ displayName: 'Offset', description: 'Use nextOffset from the previous call.', required: false }),
  },
  async run({ auth, propsValue }) {
    const limit = posthogClient.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 100, fallback: 50 });
    const offset = posthogClient.parseInteger({ value: propsValue.offset, label: 'Offset', min: 0, max: 1_000_000, fallback: 0 });
    const body = await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.GET,
      path: posthogClient.projectPath({ auth: auth.props, segments: ['experiments'] }),
      query: { limit, offset },
    });
    return posthogMappers.page({ body, offset, map: experimentSummary });
  },
});
