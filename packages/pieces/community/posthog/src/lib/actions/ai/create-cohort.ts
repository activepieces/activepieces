import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { cohortOf, cohortOutputSchema } from './get-cohort';

function propertyFilters(matchProperties: Record<string, unknown> | undefined) {
  return Object.entries(matchProperties ?? {}).map(([key, value]) => {
    if (key.trim() === '') throw new Error('Match Person Properties must not contain an empty key.');
    if (value === null || typeof value === 'object') throw new Error(`Match Person Properties: the value for "${key}" must be text, a number or true/false.`);
    return { key, value, type: 'person', operator: 'exact' };
  });
}

const createCohort = createAction({
  auth: posthogAuth,
  name: 'create_cohort',
  classification: 'WRITE',
  displayName: 'Create Cohort',
  description: 'Create a static cohort, or a dynamic cohort that matches person properties.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a PostHog cohort. With isStatic true it creates an empty static cohort; fill it with Add Persons to Static Cohort. Otherwise it creates a dynamic cohort of every person whose properties exactly equal all pairs in matchProperties (e.g. {"plan":"pro","country":"US"}); matchProperties is required for a dynamic cohort. PostHog calculates count in the background. Each call creates another cohort. Returns the cohort id.',
    idempotent: false,
  },
  outputSchema: cohortOutputSchema,
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    isStatic: Property.Checkbox({ displayName: 'Static Cohort', description: 'Static cohorts hold a fixed list of persons you add yourself.', required: false, defaultValue: false }),
    matchProperties: Property.Object({ displayName: 'Match Person Properties', description: 'Dynamic cohorts only: persons whose properties equal all of these values.', required: false }),
  },
  async run({ auth, propsValue }) {
    const name = posthogClient.requiredText({ value: propsValue.name, label: 'Name' });
    const isStatic = posthogClient.parseBoolean({ value: propsValue.isStatic, label: 'Static Cohort' }) ?? false;
    const filters = propertyFilters(posthogClient.plainObject({ value: propsValue.matchProperties, label: 'Match Person Properties' }));
    if (isStatic && filters.length > 0) throw new Error('A static cohort cannot have Match Person Properties; leave them empty or turn off Static Cohort.');
    if (!isStatic && filters.length === 0) throw new Error('A dynamic cohort needs at least one Match Person Properties pair.');
    const body = await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.POST,
      path: posthogClient.projectPath({ auth: auth.props, segments: ['cohorts'] }),
      body: {
        name,
        description: posthogClient.optionalText(propsValue.description) ?? '',
        is_static: isStatic,
        ...(isStatic ? {} : { filters: { properties: { type: 'OR', values: [{ type: 'AND', values: filters }] } } }),
      },
    });
    return cohortOf({ raw: body, auth: auth.props });
  },
});

export { createCohort };
