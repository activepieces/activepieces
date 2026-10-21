import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../auth';
import { posthogClient } from '../common/client';
import { posthogOutputSchemas } from '../common/output-schemas';

export const posthogGetFeatureFlags = createAction({
  auth: posthogAuth,
  name: 'get_feature_flags',
  classification: 'SEARCH',
  displayName: 'Get Feature Flags',
  description: 'List all feature flags in your PostHog project',
  audience: 'both',
  aiMetadata: {
    description: 'Lists feature flags in the connected PostHog project (deleted flags excluded), up to limit (1-200, default 100). Returns each flag id, key, name (description), active, tags and creator. Use the numeric id with Get, Update or Delete Feature Flag. Read-only.',
    idempotent: true,
  },
  outputSchema: posthogOutputSchemas.legacyFlags,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of feature flags to return, 1-200 (default: 100)',
      required: false,
      defaultValue: 100,
    }),
  },
  async run({ auth, propsValue }) {
    const limit = posthogClient.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 200, fallback: 100 });
    const body = await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.GET,
      path: posthogClient.projectPath({ auth: auth.props, segments: ['feature_flags'] }),
      query: { limit },
    });
    return posthogClient.arrayOf(posthogClient.recordOf(body)['results']).slice(0, limit).map((raw) => {
      const flag = posthogClient.recordOf(raw);
      const tags = posthogClient.arrayOf(flag['tags']).filter((t): t is string => typeof t === 'string');
      return {
        id: posthogClient.num(flag['id']),
        name: posthogClient.str(flag['name']),
        key: posthogClient.str(flag['key']),
        active: flag['active'] === true,
        deleted: flag['deleted'] === true,
        created_at: posthogClient.str(flag['created_at']),
        updated_at: posthogClient.str(flag['updated_at']),
        tags: tags.length > 0 ? tags.join(', ') : null,
        created_by_email: posthogClient.str(posthogClient.recordOf(flag['created_by'])['email']),
        created_by_name: posthogClient.userName(flag['created_by']),
      };
    });
  },
});
