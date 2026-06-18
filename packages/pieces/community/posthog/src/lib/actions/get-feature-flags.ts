import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../..';

export const posthogGetFeatureFlags = createAction({
  auth: posthogAuth,
  name: 'get_feature_flags',
  displayName: 'Get Feature Flags',
  description: 'List all feature flags in your PostHog project',
  audience: 'both',
  aiMetadata: { description: 'Retrieves feature flags defined in the connected PostHog project, including each flag key, name, and active state, with an optional result limit. Use to inspect or audit which feature flags exist. Idempotent: a read-only lookup with no side effects.', idempotent: true },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of feature flags to return (default: 100)',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const { personal_api_key, project_id, api_host } = context.auth.props;
    const apiBase = api_host || 'https://us.posthog.com';

    const result = await httpClient.sendRequest<FeatureFlagsResponse>({
      method: HttpMethod.GET,
      url: `${apiBase}/api/projects/${project_id}/feature_flags/`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: personal_api_key,
      },
      queryParams: {
        limit: String(context.propsValue.limit ?? 100),
      },
    });

    return (result.body.results ?? []).map((flag) => ({
      id: flag.id,
      name: flag.name,
      key: flag.key,
      active: flag.active,
      deleted: flag.deleted,
      created_at: flag.created_at,
      updated_at: flag.updated_at,
      tags: Array.isArray(flag.tags) ? flag.tags.join(', ') : null,
      created_by_email: flag.created_by?.email ?? null,
      created_by_name: flag.created_by
        ? `${flag.created_by.first_name} ${flag.created_by.last_name}`.trim()
        : null,
    }));
  },
});

type FeatureFlag = {
  id: number;
  name: string;
  key: string;
  active: boolean;
  deleted: boolean;
  created_at: string;
  updated_at: string;
  tags: string[];
  created_by: { email: string; first_name: string; last_name: string } | null;
};

type FeatureFlagsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: FeatureFlag[];
};
