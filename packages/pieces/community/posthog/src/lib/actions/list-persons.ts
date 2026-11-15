import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../auth';
import { posthogClient } from '../common/client';
import { posthogOutputSchemas } from '../common/output-schemas';

export const posthogListPersons = createAction({
  auth: posthogAuth,
  name: 'list_persons',
  classification: 'SEARCH',
  displayName: 'List Persons',
  description: 'Get a list of identified users in your PostHog project',
  audience: 'both',
  aiMetadata: {
    description: 'Lists persons (identified users) in the connected PostHog project, newest first, up to limit (1-100, default 100). search filters by email, name or distinct ID (partial match). Returns id (numeric), uuid, distinct_ids (comma separated), name, email, created_at. To look up one known distinct ID exactly, use Get Person instead. Read-only.',
    idempotent: true,
  },
  outputSchema: posthogOutputSchemas.legacyPersons,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of persons to return, 1-100 (default: 100)',
      required: false,
      defaultValue: 100,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Filter persons by email or name',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const limit = posthogClient.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 100, fallback: 100 });
    const body = await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.GET,
      path: posthogClient.projectPath({ auth: auth.props, segments: ['persons'] }),
      query: { limit, search: posthogClient.optionalText(propsValue.search) },
    });
    return posthogClient.arrayOf(posthogClient.recordOf(body)['results']).slice(0, limit).map((raw) => {
      const person = posthogClient.recordOf(raw);
      const ids = posthogClient.arrayOf(person['distinct_ids']).filter((d): d is string => typeof d === 'string');
      return {
        id: person['id'] ?? null,
        uuid: posthogClient.str(person['uuid']),
        distinct_ids: ids.length > 0 ? ids.join(', ') : null,
        name: posthogClient.str(person['name']),
        email: posthogClient.str(posthogClient.recordOf(person['properties'])['email']),
        created_at: posthogClient.str(person['created_at']),
        updated_at: posthogClient.str(person['updated_at']),
      };
    });
  },
});
