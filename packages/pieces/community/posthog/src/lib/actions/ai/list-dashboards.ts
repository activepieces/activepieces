import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { posthogMappers } from '../../common/mappers';
import { posthogOutputSchemas } from '../../common/output-schemas';

export const listDashboards = createAction({
  auth: posthogAuth,
  name: 'list_dashboards',
  classification: 'SEARCH',
  displayName: 'List Dashboards',
  description: 'List dashboards.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists dashboards in the PostHog project, optionally filtered by name with search. Returns id, name, description, pinned and a link, plus hasMore/nextOffset (limit 1-100). Read-only.',
    idempotent: true,
  },
  outputSchema: posthogOutputSchemas.dashboards,
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
      path: posthogClient.projectPath({ auth: auth.props, segments: ['dashboards'] }),
      query: { limit, offset, search: posthogClient.optionalText(propsValue.search) },
    });
    return posthogMappers.page({
      body,
      offset,
      map: (raw) => {
        const r = posthogClient.recordOf(raw);
        return {
          id: posthogClient.num(r['id']),
          name: posthogClient.str(r['name']),
          description: posthogClient.str(r['description']),
          pinned: r['pinned'] === true,
          createdAt: posthogClient.str(r['created_at']),
          url: typeof r['id'] === 'number' ? posthogMappers.webUrl({ auth: auth.props, path: ['dashboard', r['id']] }) : null,
        };
      },
    });
  },
});
