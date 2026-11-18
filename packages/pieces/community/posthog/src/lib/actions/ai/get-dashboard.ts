import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { posthogMappers } from '../../common/mappers';

const MAX_TILES = 100;

const dashboardOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Dashboard ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'pinned', label: 'Pinned', format: 'boolean' },
    { key: 'tags', label: 'Tags' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'createdBy', label: 'Created By (email)', format: 'email' },
    {
      key: 'tiles',
      label: 'Tiles',
      labelKey: 'insightName',
      listItems: [
        { key: 'tileId', label: 'Tile ID', format: 'number' },
        { key: 'type', label: 'Type', description: 'insight or text.' },
        { key: 'insightId', label: 'Insight ID', format: 'number' },
        { key: 'insightShortId', label: 'Insight Short ID' },
        { key: 'insightName', label: 'Insight Name' },
        { key: 'queryKind', label: 'Query Kind' },
        { key: 'text', label: 'Text' },
        { key: 'lastRefresh', label: 'Last Refresh', format: 'datetime' },
      ],
    },
    { key: 'tileCount', label: 'Tile Count', format: 'number' },
    { key: 'tilesTruncated', label: 'Tiles Truncated', format: 'boolean' },
    { key: 'url', label: 'URL', format: 'url' },
  ],
};

function mapTile(raw: unknown) {
  const t = posthogClient.recordOf(raw);
  const insight = posthogClient.isRecord(t['insight']) ? t['insight'] : null;
  const text = posthogClient.recordOf(t['text']);
  const query = posthogClient.recordOf(insight?.['query']);
  const source = posthogClient.recordOf(query['source']);
  return {
    tileId: posthogClient.num(t['id']),
    type: insight === null ? 'text' : 'insight',
    insightId: insight === null ? null : posthogClient.num(insight['id']),
    insightShortId: insight === null ? null : posthogClient.str(insight['short_id']),
    insightName: insight === null ? null : posthogClient.str(insight['name']) ?? posthogClient.str(insight['derived_name']),
    queryKind: posthogClient.str(source['kind']) ?? posthogClient.str(query['kind']),
    text: posthogClient.str(text['body']),
    lastRefresh: posthogClient.str(t['last_refresh']) ?? (insight === null ? null : posthogClient.str(insight['last_refresh'])),
  };
}

export const getDashboard = createAction({
  auth: posthogAuth,
  name: 'get_dashboard',
  classification: 'READ',
  displayName: 'Get Dashboard',
  description: 'Get a dashboard and a summary of its tiles.',
  audience: 'ai',
  aiMetadata: {
    description: 'Gets one PostHog dashboard by numeric dashboard id (from List Dashboards). Returns name, description, pinned, tags, a link and a summary of up to 100 tiles: each insight tile has insightId, insightShortId, insightName and queryKind; text tiles have text. Chart numbers are not included; pass an insightId to Get Insight for them. Read-only.',
    idempotent: true,
  },
  outputSchema: dashboardOutputSchema,
  props: {
    dashboardId: Property.ShortText({ displayName: 'Dashboard ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const dashboardId = posthogClient.numericId({ value: propsValue.dashboardId, label: 'Dashboard ID' });
    const body = await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.GET,
      path: posthogClient.projectPath({ auth: auth.props, segments: ['dashboards', dashboardId] }),
    });
    const r = posthogClient.recordOf(body);
    const tiles = posthogClient.arrayOf(r['tiles']).filter((t) => posthogClient.recordOf(t)['deleted'] !== true);
    const id = posthogClient.num(r['id']);
    return {
      id,
      name: posthogClient.str(r['name']),
      description: posthogClient.str(r['description']),
      pinned: r['pinned'] === true,
      tags: posthogClient.arrayOf(r['tags']).filter((t): t is string => typeof t === 'string'),
      createdAt: posthogClient.str(r['created_at']),
      createdBy: posthogClient.str(posthogClient.recordOf(r['created_by'])['email']),
      tiles: tiles.slice(0, MAX_TILES).map(mapTile),
      tileCount: tiles.length,
      tilesTruncated: tiles.length > MAX_TILES,
      url: id === null ? null : posthogMappers.webUrl({ auth: auth.props, path: ['dashboard', id] }),
    };
  },
});
