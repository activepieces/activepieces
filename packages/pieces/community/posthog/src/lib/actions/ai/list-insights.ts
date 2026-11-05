import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { posthogMappers } from '../../common/mappers';
import { posthogOutputSchemas } from '../../common/output-schemas';

export const listInsights = createAction({
  auth: posthogAuth,
  name: 'list_insights',
  classification: 'SEARCH',
  displayName: 'List Insights',
  description: 'List saved insights (charts).',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists saved insights (charts, funnels, trends) in the PostHog project, newest edits first, optionally filtered by name with search. Returns id, shortId, name, description, favorited, lastModifiedAt and a link, plus hasMore/nextOffset (limit 1-100). To compute numbers, use Run HogQL Query. Read-only.',
    idempotent: true,
  },
  outputSchema: posthogOutputSchemas.insights,
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
      path: posthogClient.projectPath({ auth: auth.props, segments: ['insights'] }),
      query: { limit, offset, search: posthogClient.optionalText(propsValue.search), saved: 'true', basic: 'true', order: '-last_modified_at' },
    });
    return posthogMappers.page({
      body,
      offset,
      map: (raw) => {
        const r = posthogClient.recordOf(raw);
        return {
          id: posthogClient.num(r['id']),
          shortId: posthogClient.str(r['short_id']),
          name: posthogClient.str(r['name']) ?? posthogClient.str(r['derived_name']),
          description: posthogClient.str(r['description']),
          favorited: r['favorited'] === true,
          lastModifiedAt: posthogClient.str(r['last_modified_at']),
          url: typeof r['short_id'] === 'string' ? posthogMappers.webUrl({ auth: auth.props, path: ['insights', r['short_id']] }) : null,
        };
      },
    });
  },
});
