import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';

const MAX_PERSONS = 1000;

function personIdsOf(value: unknown): string[] {
  const list = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  const ids = list.map((item, i) => posthogClient.uuid({ value: item, label: `Person ID ${i + 1}` })).filter((id): id is string => id !== undefined);
  const unique = [...new Set(ids)];
  if (unique.length === 0) throw new Error('Person IDs needs at least one person UUID.');
  if (unique.length > MAX_PERSONS) throw new Error(`Person IDs accepts at most ${MAX_PERSONS} UUIDs per call.`);
  return unique;
}

const addPersonsToStaticCohort = createAction({
  auth: posthogAuth,
  name: 'add_persons_to_static_cohort',
  classification: 'WRITE',
  displayName: 'Add Persons to Static Cohort',
  description: 'Add persons to a static cohort by their person UUIDs.',
  audience: 'ai',
  aiMetadata: {
    description: 'Adds persons to a static PostHog cohort (isStatic true; dynamic cohorts are rejected by PostHog). cohortId is the numeric id from List Cohorts or Create Cohort; personIds are person UUIDs (the id from Get Person), up to 1000 per call. Adding a person who is already in the cohort has no effect.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      { key: 'cohortId', label: 'Cohort ID', format: 'number' },
      { key: 'addedPersonIds', label: 'Person IDs Sent' },
      { key: 'count', label: 'Persons Sent', format: 'number' },
    ],
  },
  props: {
    cohortId: Property.ShortText({ displayName: 'Cohort ID', required: true }),
    personIds: Property.Array({ displayName: 'Person IDs', description: 'Person UUIDs.', required: true }),
  },
  async run({ auth, propsValue }) {
    const cohortId = posthogClient.numericId({ value: propsValue.cohortId, label: 'Cohort ID' });
    const personIds = personIdsOf(propsValue.personIds);
    await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.PATCH,
      path: posthogClient.projectPath({ auth: auth.props, segments: ['cohorts', cohortId, 'add_persons_to_static_cohort'] }),
      body: { person_ids: personIds },
    });
    return { cohortId: Number(cohortId), addedPersonIds: personIds, count: personIds.length };
  },
});

export { addPersonsToStaticCohort };
