import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { posthogMappers } from '../../common/mappers';
import { posthogOutputSchemas } from '../../common/output-schemas';

export const listEventDefinitions = createAction({
  auth: posthogAuth,
  name: 'list_event_definitions',
  classification: 'SEARCH',
  displayName: 'List Event Names',
  description: 'List the event names tracked in the project.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists the event names (event definitions) PostHog has seen in the project, optionally filtered by search (partial name). Use it to find the exact event name before Run HogQL Query or Capture Event. Returns name, description, lastSeenAt and verified, plus hasMore/nextOffset (limit 1-100). Read-only.',
    idempotent: true,
  },
  outputSchema: posthogOutputSchemas.eventDefinitions,
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
      path: posthogClient.projectPath({ auth: auth.props, segments: ['event_definitions'] }),
      query: { limit, offset, search: posthogClient.optionalText(propsValue.search) },
    });
    return posthogMappers.page({
      body,
      offset,
      map: (raw) => {
        const r = posthogClient.recordOf(raw);
        return {
          id: posthogClient.str(r['id']),
          name: posthogClient.str(r['name']),
          description: posthogClient.str(r['description']),
          lastSeenAt: posthogClient.str(r['last_seen_at']),
          verified: r['verified'] === true,
        };
      },
    });
  },
});
