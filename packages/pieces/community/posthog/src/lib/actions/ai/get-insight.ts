import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { PostHogAuthValue, posthogClient } from '../../common/client';
import { posthogMappers } from '../../common/mappers';

const MAX_RESULT_CHARS = 20_000;
const REFRESH_MODES = ['none', 'cache', 'blocking'];

const insightOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Insight ID', format: 'number' },
    { key: 'shortId', label: 'Short ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'queryKind', label: 'Query Kind', description: 'e.g. TrendsQuery, FunnelsQuery, HogQLQuery.' },
    { key: 'query', label: 'Query (raw)' },
    { key: 'result', label: 'Result', description: 'Computed result, null when not computed or cached. Truncated to about 20,000 characters.' },
    { key: 'resultTruncated', label: 'Result Truncated', format: 'boolean' },
    { key: 'lastRefresh', label: 'Last Refresh', format: 'datetime' },
    { key: 'dashboardIds', label: 'Dashboard IDs' },
    { key: 'favorited', label: 'Favorited', format: 'boolean' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'lastModifiedAt', label: 'Last Modified At', format: 'datetime' },
    { key: 'url', label: 'URL', format: 'url' },
  ],
};

function boundedResult(value: unknown): { result: unknown; resultTruncated: boolean } {
  if (value === undefined || value === null) return { result: null, resultTruncated: false };
  const text = JSON.stringify(value);
  if (text.length <= MAX_RESULT_CHARS) return { result: value, resultTruncated: false };
  if (Array.isArray(value)) {
    const kept: unknown[] = [];
    let size = 2;
    for (const item of value) {
      const itemSize = JSON.stringify(item).length + 1;
      if (size + itemSize > MAX_RESULT_CHARS) break;
      kept.push(item);
      size += itemSize;
    }
    if (kept.length > 0) return { result: kept, resultTruncated: true };
  }
  return { result: text.slice(0, MAX_RESULT_CHARS), resultTruncated: true };
}

function mapInsight({ raw, auth }: { raw: unknown; auth: PostHogAuthValue }) {
  const r = posthogClient.recordOf(raw);
  const query = posthogClient.recordOf(r['query']);
  const source = posthogClient.recordOf(query['source']);
  const shortId = posthogClient.str(r['short_id']);
  return {
    id: posthogClient.num(r['id']),
    shortId,
    name: posthogClient.str(r['name']) ?? posthogClient.str(r['derived_name']),
    description: posthogClient.str(r['description']),
    queryKind: posthogClient.str(source['kind']) ?? posthogClient.str(query['kind']),
    query: posthogClient.isRecord(r['query']) ? r['query'] : null,
    ...boundedResult(r['result']),
    lastRefresh: posthogClient.str(r['last_refresh']),
    dashboardIds: posthogClient.arrayOf(r['dashboards']).filter((d): d is number => typeof d === 'number'),
    favorited: r['favorited'] === true,
    createdAt: posthogClient.str(r['created_at']),
    lastModifiedAt: posthogClient.str(r['last_modified_at']),
    url: shortId === null ? null : posthogMappers.webUrl({ auth, path: ['insights', shortId] }),
  };
}

export const getInsight = createAction({
  auth: posthogAuth,
  name: 'get_insight',
  classification: 'READ',
  displayName: 'Get Insight',
  description: 'Get a saved insight (chart) and its computed result.',
  audience: 'ai',
  aiMetadata: {
    description: 'Gets one saved PostHog insight by numeric id or by its shortId (the code in the insight URL /insights/{shortId}), both from List Insights. Returns name, description, the query definition, dashboardIds, a link and the computed result. refresh: cache (default) returns the cached result if one exists (result may be null), blocking recalculates now (slower, uses query quota), none skips the result. Results larger than about 20,000 characters are cut and resultTruncated is true. Read-only.',
    idempotent: true,
  },
  outputSchema: insightOutputSchema,
  props: {
    insightId: Property.ShortText({ displayName: 'Insight ID or Short ID', required: true }),
    refresh: Property.StaticDropdown({
      displayName: 'Refresh',
      required: false,
      defaultValue: 'cache',
      options: {
        options: [
          { label: 'Use cached result', value: 'cache' },
          { label: 'Recalculate now', value: 'blocking' },
          { label: 'Do not include result', value: 'none' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const idOrShort = posthogClient.requiredText({ value: propsValue.insightId, label: 'Insight ID or Short ID' });
    if (!/^[A-Za-z0-9]+$/.test(idOrShort)) throw new Error('Insight ID or Short ID may only contain letters and digits.');
    const refresh = posthogClient.optionalText(propsValue.refresh) ?? 'cache';
    if (!REFRESH_MODES.includes(refresh)) throw new Error('Refresh must be cache, blocking or none.');
    const refreshParam = refresh === 'blocking' ? 'blocking' : refresh === 'cache' ? 'force_cache' : undefined;
    let raw: unknown;
    if (/^\d+$/.test(idOrShort)) {
      raw = await posthogClient.request({
        auth: auth.props,
        method: HttpMethod.GET,
        path: posthogClient.projectPath({ auth: auth.props, segments: ['insights', idOrShort] }),
        query: { refresh: refreshParam },
      });
    } else {
      const body = await posthogClient.request({
        auth: auth.props,
        method: HttpMethod.GET,
        path: posthogClient.projectPath({ auth: auth.props, segments: ['insights'] }),
        query: { short_id: idOrShort, refresh: refreshParam },
      });
      const match = posthogClient.arrayOf(posthogClient.recordOf(body)['results']).find((item) => posthogClient.recordOf(item)['short_id'] === idOrShort);
      if (match === undefined) throw new Error(`No insight with short ID ${idOrShort} was found in this project.`);
      raw = match;
    }
    const insight = mapInsight({ raw, auth: auth.props });
    return refresh === 'none' ? { ...insight, result: null, resultTruncated: false } : insight;
  },
});
