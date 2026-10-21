import { posthogClient, PostHogAuthValue } from './client';

const { recordOf, str, num, arrayOf, isRecord } = posthogClient;

function person(raw: unknown) {
  const p = recordOf(raw);
  const properties = recordOf(p['properties']);
  return {
    id: str(p['uuid']) ?? str(p['id']),
    name: str(p['name']),
    email: str(properties['email']),
    distinctIds: arrayOf(p['distinct_ids']).filter((d): d is string => typeof d === 'string'),
    properties,
    createdAt: str(p['created_at']),
  };
}

function rolloutOf(filters: Record<string, unknown>): number | null {
  const groups = arrayOf(filters['groups']);
  if (groups.length !== 1 || isRecord(filters['multivariate'])) return null;
  return num(recordOf(groups[0])['rollout_percentage']);
}

function webUrl({ auth, path }: { auth: PostHogAuthValue; path: (string | number)[] }): string {
  return `${posthogClient.apiHostOf(auth)}/project/${encodeURIComponent(String(auth.project_id).trim())}/${path.map((s) => encodeURIComponent(String(s))).join('/')}`;
}

function flag({ raw, auth }: { raw: unknown; auth: PostHogAuthValue }) {
  const f = recordOf(raw);
  const filters = recordOf(f['filters']);
  const id = num(f['id']);
  return {
    id,
    key: str(f['key']),
    name: str(f['name']),
    active: f['active'] === true,
    deleted: f['deleted'] === true,
    rolloutPercentage: rolloutOf(filters),
    filters,
    tags: arrayOf(f['tags']).filter((t): t is string => typeof t === 'string'),
    createdAt: str(f['created_at']),
    updatedAt: str(f['updated_at']),
    createdBy: str(recordOf(f['created_by'])['email']),
    url: id === null ? null : webUrl({ auth, path: ['feature_flags', id] }),
  };
}

function annotation(raw: unknown) {
  const a = recordOf(raw);
  return {
    id: num(a['id']),
    content: str(a['content']),
    dateMarker: str(a['date_marker']),
    scope: str(a['scope']),
    createdAt: str(a['created_at']),
  };
}

function page<T>({ body, offset, map }: { body: unknown; offset: number; map: (item: unknown) => T }) {
  const b = recordOf(body);
  const items = arrayOf(b['results']).map(map);
  const hasMore = typeof b['next'] === 'string' && b['next'] !== '';
  return { items, count: items.length, hasMore, nextOffset: hasMore ? offset + items.length : null };
}

export const posthogMappers = { person, flag, annotation, page, webUrl };
