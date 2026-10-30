import { createAction, OutputSchema, OutputSchemaField, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { PostHogAuthValue, posthogClient } from '../../common/client';
import { posthogMappers } from '../../common/mappers';

const actionItemFields: OutputSchemaField[] = [
  { key: 'id', label: 'Action ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'tags', label: 'Tags' },
  { key: 'stepCount', label: 'Match Rules', format: 'number' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'lastCalculatedAt', label: 'Last Calculated At', format: 'datetime' },
  { key: 'url', label: 'URL', format: 'url' },
];

const actionsOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Actions', labelKey: 'name', listItems: actionItemFields },
    { key: 'count', label: 'Returned', format: 'number' },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
    { key: 'nextOffset', label: 'Next Offset', format: 'number', description: 'Pass as offset to get the next page; null when there is none.' },
  ],
};

function mapActionSummary({ raw, auth }: { raw: unknown; auth: PostHogAuthValue }) {
  const r = posthogClient.recordOf(raw);
  const id = posthogClient.num(r['id']);
  return {
    id,
    name: posthogClient.str(r['name']),
    description: posthogClient.str(r['description']),
    tags: posthogClient.arrayOf(r['tags']).filter((t): t is string => typeof t === 'string'),
    stepCount: posthogClient.arrayOf(r['steps']).length,
    createdAt: posthogClient.str(r['created_at']),
    lastCalculatedAt: posthogClient.str(r['last_calculated_at']),
    url: id === null ? null : posthogMappers.webUrl({ auth, path: ['data-management', 'actions', id] }),
  };
}

export const listActions = createAction({
  auth: posthogAuth,
  name: 'list_actions',
  classification: 'SEARCH',
  displayName: 'List Actions',
  description: 'List action definitions (named groups of events).',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists PostHog actions in the project: saved definitions that group events by rules (e.g. "Signed up" = $pageview on /welcome or a click on a button). Optionally filtered by name with search. Returns id, name, description, tags, stepCount (number of match rules) and a link, plus hasMore/nextOffset (limit 1-100). Use Get Action for the rules. Read-only.',
    idempotent: true,
  },
  outputSchema: actionsOutputSchema,
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
      path: posthogClient.projectPath({ auth: auth.props, segments: ['actions'] }),
      query: { limit, offset, search: posthogClient.optionalText(propsValue.search) },
    });
    return posthogMappers.page({ body, offset, map: (raw) => mapActionSummary({ raw, auth: auth.props }) });
  },
});
