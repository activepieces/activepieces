import crypto from 'crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { SendItRecord, isRecord, optionalText, pathId, readList, requireText, sendItApi } from './client';

export function validateLimit({ value, label, max }: { value: unknown; label: string; max: number }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > max) {
    throw new Error(`${label} must be a whole number between 1 and ${max}.`);
  }
  return number;
}

export const sendItRequests = {
  buildPost,
  idempotencyKey,
  futureIso,
  publish,
  schedule,
  validate,
  listAccounts,
  listScheduled,
  getScheduled,
  cancel,
  triggerNow,
  requirements,
  analytics,
  listDeadLetter,
  scheduleIdOf,
};

const MEDIA_REQUIRED_PLATFORMS = ['instagram', 'instagram-standalone', 'pinterest', 'youtube', 'tiktok'];

const MAX_IDEMPOTENCY_KEY = 255;

const SCHEDULE_SLACK_MS = 60_000;

function normalizePlatforms(value: unknown): string[] {
  const raw = Array.isArray(value) ? value.flat() : typeof value === 'string' ? value.split(',') : [];
  const platforms = [...new Set(raw.map((item) => optionalText(item)?.toLowerCase()).filter((item): item is string => item !== undefined))];
  if (platforms.length === 0) {
    throw new Error('Select at least one platform.');
  }
  return platforms;
}

function httpsUrl({ value, label }: { value: string; label: string }): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} "${value.slice(0, 200)}" is not a valid URL.`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`${label} must be a public https:// URL.`);
  }
  return value;
}

function normalizeMediaUrls(value: unknown): string[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[\n,]/) : [value];
  const urls = raw
    .map((item) => (isRecord(item) ? Object.values(item).find((inner) => typeof inner === 'string') : item))
    .map((item) => optionalText(item))
    .filter((item): item is string => item !== undefined);
  return urls.map((url) => httpsUrl({ value: url, label: 'Media URL' }));
}

function parsePlatformSettings(value: unknown): SendItRecord | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed: unknown = typeof value === 'string' ? JSON.parse(value) : value;
  if (!isRecord(parsed)) {
    throw new Error('Platform Settings must be a JSON object keyed by platform, e.g. {"pinterest": {"boardId": "123"}}.');
  }
  return Object.keys(parsed).length > 0 ? parsed : undefined;
}

function buildPost({ input, requireMedia = true }: { input: PostInput; requireMedia?: boolean }): { platforms: string[]; content: SendItRecord } {
  const platforms = normalizePlatforms(input.platforms);
  const text = requireText({ value: input.text, label: 'Post Text' });
  const mediaUrl = optionalText(input.mediaUrl);
  const mediaUrls = normalizeMediaUrls(input.mediaUrls);
  const hasMedia = mediaUrl !== undefined || mediaUrls.length > 0;
  const needsMedia = platforms.filter((platform) => MEDIA_REQUIRED_PLATFORMS.includes(platform));
  if (requireMedia && !hasMedia && needsMedia.length > 0) {
    throw new Error(`${needsMedia.join(', ')}: a Media URL (image or video) is required. Add one or remove these platforms.`);
  }
  const mediaType = optionalText(input.mediaType);
  const content: SendItRecord = { text };
  if (mediaUrl !== undefined) {
    content['mediaUrl'] = httpsUrl({ value: mediaUrl, label: 'Media URL' });
  }
  if (mediaUrls.length > 0) {
    content['mediaUrls'] = mediaUrls;
  }
  if (hasMedia && mediaType !== undefined) {
    content['mediaType'] = mediaType;
  }
  const title = optionalText(input.title);
  if (title !== undefined) {
    content['title'] = title;
  }
  const firstComment = optionalText(input.firstComment);
  if (firstComment !== undefined) {
    content['firstComment'] = firstComment;
  }
  const platformSettings = parsePlatformSettings(input.platformSettings);
  if (platformSettings !== undefined) {
    content['platformSettings'] = platformSettings;
  }
  return { platforms, content };
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonical).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value)
      .filter((entry) => entry[1] !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

// The default key hashes the step input so each Loop iteration (same run + step, different post) gets its own key.
function idempotencyKey({ override, runId, stepName, operation, input }: { override: unknown; runId: string; stepName: string; operation: string; input: unknown }): string {
  const custom = optionalText(override);
  if (custom !== undefined) {
    return custom.slice(0, MAX_IDEMPOTENCY_KEY);
  }
  const digest = crypto.createHash('sha256').update(`${runId}|${stepName}|${operation}|${canonical(input)}`).digest('hex').slice(0, 40);
  return `activepieces:${operation}:${digest}`.slice(0, MAX_IDEMPOTENCY_KEY);
}

function futureIso({ value, now = Date.now() }: { value: unknown; now?: number }): string {
  const text = requireText({ value, label: 'Scheduled Time' });
  const ms = Date.parse(text);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(text) || Number.isNaN(ms)) {
    throw new Error('Scheduled Time must be an ISO-8601 date-time, e.g. 2026-01-31T09:00:00Z.');
  }
  if (ms < now - SCHEDULE_SLACK_MS) {
    throw new Error(`Scheduled Time ${new Date(ms).toISOString()} is in the past. Pick a future time (UTC).`);
  }
  return new Date(ms).toISOString();
}

async function publish({ apiKey, input, key }: { apiKey: string; input: PostInput; key: string }): Promise<SendItRecord> {
  const body = buildPost({ input });
  const response = await sendItApi.request({ apiKey, method: HttpMethod.POST, path: '/publish', operation: 'publish post', body, headers: { 'Idempotency-Key': key } });
  return withResultIds({ response, idempotencyKey: key });
}

async function schedule({ apiKey, input, scheduledTime, key }: { apiKey: string; input: PostInput; scheduledTime: unknown; key: string }): Promise<SendItRecord> {
  const body = { ...buildPost({ input }), scheduledTime: futureIso({ value: scheduledTime }) };
  const response = await sendItApi.request({ apiKey, method: HttpMethod.POST, path: '/schedule', operation: 'schedule post', body, headers: { 'Idempotency-Key': key } });
  const record = isRecord(response) ? response : {};
  const nested = isRecord(record['schedule']) ? record['schedule'] : isRecord(record['post']) ? record['post'] : {};
  const scheduleId = optionalText(record['scheduleId']) ?? optionalText(record['id']) ?? optionalText(nested['scheduleId']) ?? optionalText(nested['id']) ?? null;
  return { ...record, scheduleId, scheduledTime: record['scheduledTime'] ?? body.scheduledTime, idempotencyKey: key };
}

async function validate({ apiKey, input }: { apiKey: string; input: PostInput }): Promise<SendItRecord> {
  const body = buildPost({ input, requireMedia: false });
  return sendItApi.request({ apiKey, method: HttpMethod.POST, path: '/validate', operation: 'validate content', body });
}

async function listAccounts({ apiKey, limit }: { apiKey: string; limit?: number }): Promise<SendItRecord & { accounts: SendItRecord[]; count: number }> {
  const response = await sendItApi.request({ apiKey, method: HttpMethod.GET, path: '/accounts', operation: 'list accounts', query: { limit } });
  const accounts = readList({ body: response, key: 'accounts' });
  return { ...(isRecord(response) ? response : {}), accounts, count: accounts.length };
}

async function listScheduled({ apiKey, platform }: { apiKey: string; platform?: string }): Promise<SendItRecord & { posts: SendItRecord[]; count: number }> {
  const response = await sendItApi.request({ apiKey, method: HttpMethod.GET, path: '/scheduled', operation: 'list scheduled posts', query: { platform: optionalText(platform) } });
  const posts = readList({ body: response, key: 'posts' });
  return { ...(isRecord(response) ? response : {}), posts, count: posts.length };
}

async function getScheduled({ apiKey, scheduleId }: { apiKey: string; scheduleId: unknown }): Promise<SendItRecord> {
  const id = requireText({ value: scheduleId, label: 'Schedule ID' });
  const { posts } = await listScheduled({ apiKey });
  const post = posts.find((item) => scheduleIdOf(item) === id);
  if (post === undefined) {
    throw new Error(`No pending scheduled post with ID "${id.slice(0, 100)}". It may have been published, cancelled or never existed; use List Scheduled Posts to see pending ones.`);
  }
  return post;
}

async function cancel({ apiKey, scheduleId }: { apiKey: string; scheduleId: unknown }): Promise<SendItRecord> {
  const id = requireText({ value: scheduleId, label: 'Schedule ID' });
  const response = await sendItApi.request({ apiKey, method: HttpMethod.DELETE, path: `/scheduled/${pathId({ value: id, label: 'Schedule ID' })}`, operation: 'cancel scheduled post' });
  return { ...(isRecord(response) ? response : {}), scheduleId: id, cancelled: true };
}

async function triggerNow({ apiKey, scheduleId }: { apiKey: string; scheduleId: unknown }): Promise<SendItRecord> {
  const id = requireText({ value: scheduleId, label: 'Schedule ID' });
  const response = await sendItApi.request({ apiKey, method: HttpMethod.POST, path: `/scheduled/${pathId({ value: id, label: 'Schedule ID' })}/trigger`, operation: 'publish scheduled post now' });
  return { ...withResultIds({ response }), scheduleId: id };
}

async function requirements({ apiKey, platform }: { apiKey: string; platform: unknown }): Promise<SendItRecord> {
  const value = requireText({ value: platform, label: 'Platform' }).toLowerCase();
  return sendItApi.request({ apiKey, method: HttpMethod.GET, path: '/requirements', operation: 'get platform requirements', query: { platform: value } });
}

async function analytics({ apiKey, platform, startDate, endDate, limit }: { apiKey: string; platform: unknown; startDate?: unknown; endDate?: unknown; limit?: number }): Promise<SendItRecord> {
  const value = requireText({ value: platform, label: 'Platform' }).toLowerCase();
  const response = await sendItApi.request({
    apiKey,
    method: HttpMethod.GET,
    path: '/analytics',
    operation: 'get post analytics',
    query: { platform: value, startDate: dateOnly({ value: startDate, label: 'Start Date' }), endDate: dateOnly({ value: endDate, label: 'End Date' }), limit },
  });
  const posts = readList({ body: response, key: 'posts' });
  return { ...(isRecord(response) ? response : {}), platform: value, posts, count: posts.length };
}

async function listDeadLetter({ apiKey, status, limit }: { apiKey: string; status?: string; limit?: number }): Promise<SendItRecord & { posts: SendItRecord[]; count: number }> {
  const response = await sendItApi.request({ apiKey, method: HttpMethod.GET, path: '/dead-letter', operation: 'list failed posts', query: { status: optionalText(status), limit } });
  const posts = readList({ body: response, key: 'posts' });
  return { ...(isRecord(response) ? response : {}), posts, count: posts.length };
}

function dateOnly({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = optionalText(value);
  if (text === undefined) {
    return undefined;
  }
  const ms = Date.parse(text);
  if (!/^\d{4}-\d{2}-\d{2}/.test(text) || Number.isNaN(ms)) {
    throw new Error(`${label} must be an ISO-8601 date, e.g. 2026-01-31.`);
  }
  return new Date(ms).toISOString();
}

function scheduleIdOf(post: SendItRecord): string | undefined {
  return optionalText(post['id']) ?? optionalText(post['scheduleId']);
}

function withResultIds({ response, idempotencyKey: key }: { response: unknown; idempotencyKey?: string }): SendItRecord {
  const record = isRecord(response) ? response : {};
  const results = Array.isArray(record['results']) ? record['results'].filter(isRecord) : [];
  const out: SendItRecord = { ...record, results };
  if (key !== undefined) {
    out['idempotencyKey'] = key;
  }
  return out;
}

export type PostInput = {
  platforms: unknown;
  text: unknown;
  mediaUrl?: unknown;
  mediaUrls?: unknown;
  mediaType?: unknown;
  title?: unknown;
  firstComment?: unknown;
  platformSettings?: unknown;
};
