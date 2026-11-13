import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient, PostHogAuthValue } from '../../common/client';
import { posthogMappers } from '../../common/mappers';

const cohortOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Cohort ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'isStatic', label: 'Static', format: 'boolean' },
    { key: 'count', label: 'Persons', format: 'number', description: 'Null until PostHog has calculated the cohort.' },
    { key: 'isCalculating', label: 'Calculating', format: 'boolean' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'filters', label: 'Filters (raw)' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'url', label: 'URL', format: 'url' },
  ],
};

function cohortOf({ raw, auth }: { raw: unknown; auth: PostHogAuthValue }) {
  const c = posthogClient.recordOf(raw);
  const id = posthogClient.num(c['id']);
  return {
    id,
    name: posthogClient.str(c['name']),
    description: posthogClient.str(c['description']),
    isStatic: c['is_static'] === true,
    count: posthogClient.num(c['count']),
    isCalculating: c['is_calculating'] === true,
    deleted: c['deleted'] === true,
    filters: posthogClient.recordOf(c['filters']),
    createdAt: posthogClient.str(c['created_at']),
    url: id === null ? null : posthogMappers.webUrl({ auth, path: ['cohorts', id] }),
  };
}

const getCohort = createAction({
  auth: posthogAuth,
  name: 'get_cohort',
  classification: 'READ',
  displayName: 'Get Cohort',
  description: 'Get one cohort by its numeric ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one PostHog cohort by numeric cohort id (from List Cohorts): name, description, isStatic, count (persons, null until calculated), isCalculating, raw filters and URL. Read-only.',
    idempotent: true,
  },
  outputSchema: cohortOutputSchema,
  props: {
    cohortId: Property.ShortText({ displayName: 'Cohort ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const cohortId = posthogClient.numericId({ value: propsValue.cohortId, label: 'Cohort ID' });
    const body = await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.GET,
      path: posthogClient.projectPath({ auth: auth.props, segments: ['cohorts', cohortId] }),
    });
    return cohortOf({ raw: body, auth: auth.props });
  },
});

export { getCohort, cohortOf, cohortOutputSchema };
