import { createAction, OutputSchema, OutputSchemaField, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { posthogMappers } from '../../common/mappers';

const { recordOf, str, num, arrayOf } = posthogClient;

function statusOf(r: Record<string, unknown>): string {
  if (r['archived'] === true) return 'archived';
  if (str(r['end_date'])) return 'complete';
  if (str(r['start_date'])) return 'running';
  return 'draft';
}

function surveySummary(raw: unknown) {
  const r = recordOf(raw);
  return {
    id: str(r['id']),
    name: str(r['name']),
    description: str(r['description']),
    type: str(r['type']),
    status: statusOf(r),
    questionCount: arrayOf(r['questions']).length,
    startDate: str(r['start_date']),
    endDate: str(r['end_date']),
    responsesLimit: num(r['responses_limit']),
    createdAt: str(r['created_at']),
  };
}

const surveyFields: OutputSchemaField[] = [
  { key: 'id', label: 'Survey ID', description: 'Use it with Get Survey and Get Survey Stats.' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'type', label: 'Type', description: 'popover, widget, api or external_survey.' },
  { key: 'status', label: 'Status', description: 'draft, running, complete or archived.' },
  { key: 'questionCount', label: 'Questions', format: 'number' },
  { key: 'startDate', label: 'Start Date', format: 'datetime' },
  { key: 'endDate', label: 'End Date', format: 'datetime' },
  { key: 'responsesLimit', label: 'Responses Limit', format: 'number' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
];

const surveysSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Surveys', labelKey: 'name', listItems: surveyFields },
    { key: 'count', label: 'Returned', format: 'number' },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
    { key: 'nextOffset', label: 'Next Offset', format: 'number', description: 'Pass as offset to get the next page; null when there is none.' },
  ],
};

export const listSurveys = createAction({
  auth: posthogAuth,
  name: 'list_surveys',
  classification: 'SEARCH',
  displayName: 'List Surveys',
  description: 'List surveys in the project.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists PostHog surveys in the project, optionally filtered by name with search. Returns id (use with Get Survey / Get Survey Stats), name, type, status (draft, running, complete, archived), questionCount and dates, plus hasMore/nextOffset for paging (limit 1-100). Read-only.',
    idempotent: true,
  },
  outputSchema: surveysSchema,
  props: {
    search: Property.ShortText({ displayName: 'Search', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: '1-100, default 50', required: false, defaultValue: 50 }),
    offset: Property.Number({ displayName: 'Offset', description: 'Use nextOffset from the previous call.', required: false }),
  },
  async run({ auth, propsValue }) {
    const limit = posthogClient.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 100, fallback: 50 });
    const offset = posthogClient.parseInteger({ value: propsValue.offset, label: 'Offset', min: 0, max: 1_000_000, fallback: 0 });
    const body = await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.GET,
      path: posthogClient.projectPath({ auth: auth.props, segments: ['surveys'] }),
      query: { limit, offset, search: posthogClient.optionalText(propsValue.search) },
    });
    return posthogMappers.page({ body, offset, map: surveySummary });
  },
});
