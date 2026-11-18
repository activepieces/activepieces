import { HttpMethod } from '@activepieces/pieces-common';
import { createHmac, timingSafeEqual } from 'crypto';
import { reviewflowzApi, ReviewflowzAuthValue } from './client';
import { reviewflowzEnrich } from './enrich';
import { reviewflowzEvents } from './events';
import { ReviewflowzEnvelope, ReviewflowzPage, ReviewflowzWebhookEndpoint } from './types';

function filtersFor(type: string): FilterName[] {
  if (type === 'review.tagged' || type === 'review.untagged') {
    return ['sources', 'locations', 'platforms', 'tags'];
  }
  if (type === 'review.owner_assigned' || type === 'review.owner_unassigned') {
    return ['sources', 'locations', 'platforms', 'owners'];
  }
  if (type === 'review.deleted') {
    return ['sources'];
  }
  if (type.startsWith('review.')) {
    return ['sources', 'locations', 'platforms', 'rating_min', 'rating_max'];
  }
  if (type.startsWith('reply.')) {
    return ['sources'];
  }
  if (type.startsWith('source.') || type.startsWith('rating.')) {
    return ['sources', 'locations', 'platforms'];
  }
  if (type.startsWith('invitation.')) {
    return ['campaigns'];
  }
  if (type === 'contact.reviewed') {
    return ['campaigns', 'sources'];
  }
  if (type === 'contact.opted_out') {
    return ['channel'];
  }
  if (type.startsWith('campaign.')) {
    return ['campaigns'];
  }
  return [];
}

function matches({ envelope, filters }: { envelope: ReviewflowzEnvelope; filters: TriggerFilters }): boolean {
  const facts = envelope.data ?? {};
  const object = reviewflowzEnrich.isRecord(facts['object']) ? facts['object'] : {};
  const type = envelope.type ?? '';
  const sourceId = type.startsWith('source.') || type.startsWith('rating.') ? object['id'] : object['source'] ?? facts['source'];
  const campaignId = type.startsWith('campaign.') ? object['id'] : object['campaign'] ?? facts['campaign'];
  const values: Record<ListFilterName, unknown> = {
    sources: sourceId,
    locations: object['location'],
    platforms: object['platform'],
    campaigns: campaignId,
    tags: facts['tag'],
    owners: facts['owner'],
    channel: facts['channel'],
  };
  const applies = filtersFor(type);
  const listMismatch = LIST_FILTERS.some((name) => {
    if (!applies.includes(name)) {
      return false;
    }
    const wanted = chosen(filters[name]);
    return wanted.length > 0 && !wanted.includes(String(values[name]));
  });
  if (listMismatch) {
    return false;
  }
  const rating = typeof object['rating'] === 'number' ? object['rating'] : null;
  const min = applies.includes('rating_min') ? toNumber(filters.rating_min) : null;
  const max = applies.includes('rating_max') ? toNumber(filters.rating_max) : null;
  if (min !== null && (rating === null || rating < min)) {
    return false;
  }
  if (max !== null && (rating === null || rating > max)) {
    return false;
  }
  return true;
}

function toOutput(envelope: ReviewflowzEnvelope): Record<string, unknown> {
  const { object, ...facts } = envelope.data ?? {};
  return {
    ...(reviewflowzEnrich.isRecord(object) ? object : {}),
    event: { id: envelope.id, type: envelope.type, timestamp: envelope.timestamp, ...facts },
  };
}

function verifySignature({
  secret,
  headers,
  rawBody,
  now = Date.now(),
}: {
  secret: string | undefined;
  headers: Record<string, string | string[] | undefined>;
  rawBody: unknown;
  now?: number;
}): boolean {
  if (!secret || typeof rawBody !== 'string') {
    return false;
  }
  const id = header({ headers, name: 'webhook-id' });
  const timestamp = parseInt(header({ headers, name: 'webhook-timestamp' }) ?? '', 10);
  const signatures = (header({ headers, name: 'webhook-signature' }) ?? '').split(' ');
  if (!id || !Number.isFinite(timestamp)) {
    return false;
  }
  if (Math.abs(now / 1000 - timestamp) > TOLERANCE_SECONDS) {
    return false;
  }
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = `v1,${createHmac('sha256', key).update(`${id}.${timestamp}.${rawBody}`).digest('base64')}`;
  return signatures.some(
    (signature) =>
      signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected)),
  );
}

async function subscribe({
  auth,
  url,
  events,
  label,
}: {
  auth: ReviewflowzAuthValue;
  url: string;
  events: string[];
  label: string;
}): Promise<StoredEndpoint> {
  const endpoint = await reviewflowzApi.call<ReviewflowzWebhookEndpoint>({
    auth,
    method: HttpMethod.POST,
    path: '/webhook-endpoints',
    body: { url, events, description: `Activepieces: ${label}`.slice(0, 200) },
  });
  return { id: endpoint.id, secret: endpoint.secret };
}

async function unsubscribe({ auth, endpoint }: { auth: ReviewflowzAuthValue; endpoint: StoredEndpoint | null }): Promise<void> {
  if (!endpoint?.id) {
    return;
  }
  const response = await reviewflowzApi.send({ auth, method: HttpMethod.DELETE, path: `/webhook-endpoints/${encodeURIComponent(String(endpoint.id))}` });
  if (!response.ok && response.status !== 404) {
    throw new Error(reviewflowzApi.errorMessage({ status: response.status, body: response.body }));
  }
}

async function handle({
  auth,
  endpoint,
  headers,
  rawBody,
  body,
  filters,
}: {
  auth: ReviewflowzAuthValue;
  endpoint: StoredEndpoint | null;
  headers: Record<string, string | string[] | undefined>;
  rawBody: unknown;
  body: unknown;
  filters: TriggerFilters;
}): Promise<Record<string, unknown>[]> {
  if (!verifySignature({ secret: endpoint?.secret, headers, rawBody })) {
    return [];
  }
  if (!isEnvelope(body) || !matches({ envelope: body, filters })) {
    return [];
  }
  return [await reviewflowzEnrich.enrich({ auth, row: toOutput(body) })];
}

async function samples({
  auth,
  types,
  filters,
}: {
  auth: ReviewflowzAuthValue;
  types: string[];
  filters: TriggerFilters;
}): Promise<Record<string, unknown>[]> {
  const page = await reviewflowzApi.call<ReviewflowzPage<ReviewflowzEnvelope>>({
    auth,
    method: HttpMethod.GET,
    path: '/events',
    query: { type: types.join(','), limit: 25 },
  });
  const recent = (page.data ?? []).filter((envelope) => matches({ envelope, filters })).slice(0, 3);
  const reviews =
    recent.length === 0 && types.length === 1 && types[0].startsWith('review.') && types[0] !== 'review.deleted'
      ? await recentReviews({ auth, type: types[0], filters })
      : [];
  const envelopes = recent.length > 0 ? recent : reviews.length > 0 ? reviews : documentedSamples(types);
  return Promise.all(envelopes.map((envelope) => reviewflowzEnrich.enrich({ auth, row: toOutput(envelope) })));
}

async function recentReviews({
  auth,
  type,
  filters,
}: {
  auth: ReviewflowzAuthValue;
  type: string;
  filters: TriggerFilters;
}): Promise<ReviewflowzEnvelope[]> {
  const join = (name: ListFilterName) => chosen(filters[name]).join(',');
  const response = await reviewflowzApi.send<ReviewflowzPage<Record<string, unknown>>>({
    auth,
    method: HttpMethod.GET,
    path: '/reviews',
    query: {
      limit: 3,
      include: 'media,reply',
      source: join('sources'),
      location: join('locations'),
      platform: join('platforms'),
      tag: join('tags'),
      owner: join('owners'),
      rating_min: toNumber(filters.rating_min),
      rating_max: toNumber(filters.rating_max),
    },
  });
  if (!response.ok) {
    return [];
  }
  return (response.body.data ?? []).map((review) => ({
    id: `evt_sample_${String(review['id'])}`,
    type,
    timestamp: String(review['created_at'] ?? ''),
    data: { object: review, source: review['source'] },
  }));
}

function documentedSamples(types: string[]): ReviewflowzEnvelope[] {
  return types
    .map((type) => reviewflowzEvents.find((event) => event.type === type)?.sample)
    .filter((sample): sample is ReviewflowzEnvelope => sample !== undefined)
    .slice(0, 1);
}

function header({ headers, name }: { headers: Record<string, string | string[] | undefined>; name: string }): string | undefined {
  const key = Object.keys(headers ?? {}).find((candidate) => candidate.toLowerCase() === name);
  const value = key ? headers[key] : undefined;
  return Array.isArray(value) ? value[0] : value;
}

function chosen(value: unknown): string[] {
  const list = Array.isArray(value) ? value : typeof value === 'string' && value !== '' ? value.split(',') : [];
  return list.map((item) => String(item).trim()).filter(Boolean);
}

function toNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isEnvelope(body: unknown): body is ReviewflowzEnvelope {
  return reviewflowzEnrich.isRecord(body) && typeof body['type'] === 'string' && reviewflowzEnrich.isRecord(body['data']);
}

const TOLERANCE_SECONDS = 30 * 60;

const LIST_FILTERS: ListFilterName[] = ['sources', 'locations', 'platforms', 'campaigns', 'tags', 'owners', 'channel'];

export const reviewflowzWebhook = {
  filtersFor,
  matches,
  toOutput,
  verifySignature,
  subscribe,
  unsubscribe,
  handle,
  samples,
  ENDPOINT_STORE_KEY: 'reviewflowz_webhook_endpoint',
};

export type StoredEndpoint = { id: string; secret?: string };

export type TriggerFilters = Partial<Record<ListFilterName, unknown>> & {
  rating_min?: unknown;
  rating_max?: unknown;
};

type ListFilterName = 'sources' | 'locations' | 'platforms' | 'campaigns' | 'tags' | 'owners' | 'channel';

type FilterName = ListFilterName | 'rating_min' | 'rating_max';
