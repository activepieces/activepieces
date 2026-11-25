import { createHmac, timingSafeEqual } from 'node:crypto';

export const DEFAULT_WEBHOOK_TOLERANCE_SECONDS = 300;
export const PAYMOS_SEEN_EVENT_IDS_KEY = 'paymos_seen_event_ids';
export const PAYMOS_SEEN_EVENT_IDS_LIMIT = 500;

export const PAYMOS_CANONICAL_WEBHOOK_EVENTS = [
  'invoice.awaiting_payment',
  'invoice.confirming',
  'invoice.underpaid_waiting',
  'invoice.paid',
  'invoice.paid_over',
  'invoice.underpaid',
  'invoice.expired',
  'invoice.cancelled',
  'invoice.paid_late',
  'payment_channel.deposit.confirming',
  'payment_channel.deposit.reorged',
  'payment_channel.deposit.confirmed',
  'withdrawal.created',
  'withdrawal.processing',
  'withdrawal.completed',
  'withdrawal.failed',
  'withdrawal.cancelled',
  'withdrawal.completion_rewound',
] as const;

export type PaymosCanonicalWebhookEvent =
  (typeof PAYMOS_CANONICAL_WEBHOOK_EVENTS)[number];

export class SignatureMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SignatureMismatchError';
  }
}

export class TimestampSkewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimestampSkewError';
  }
}

export interface WebhookEventEnvelope<T = Record<string, unknown>> {
  event_id: string;
  event_type: string;
  version: number;
  occurred_at: number;
  data: T;
}

export interface PaymosWebhookStore {
  get<T = unknown>(key: string): Promise<T | null | undefined>;
  put<T = unknown>(key: string, value: T): Promise<T | void>;
}

export interface HandlePaymosWebhookTriggerInput {
  rawBody: unknown;
  headers?: Record<string, string | string[] | undefined>;
  webhookSecret?: string;
  events?: readonly string[];
  store?: PaymosWebhookStore;
  toleranceSeconds?: number;
  nowSeconds?: number;
  maxSeenEventIds?: number;
}

interface ParsedSignatureHeader {
  timestamp: number;
  signatures: string[];
}

export function validateWebhookSecret(rawSecret: string | undefined): string {
  const secret = typeof rawSecret === 'string' ? rawSecret.trim() : '';
  if (!secret || !secret.startsWith('whsec_')) {
    throw new Error(
      'Paymos webhook verification requires a Webhook Signing Secret starting with whsec_. Register the webhook URL in Paymos Dashboard → Developer → Webhooks and paste the generated whsec_ secret.',
    );
  }
  return secret;
}

export function readWebhookSignatureHeader(
  headers: Record<string, string | string[] | undefined> | undefined,
): string {
  if (!headers) {
    return '';
  }
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== 'x-webhook-signature' || value === undefined) {
      continue;
    }
    return Array.isArray(value) ? (value[0] ?? '') : value;
  }
  return '';
}

function parseHeader(header: string): ParsedSignatureHeader | null {
  if (typeof header !== 'string') {
    return null;
  }
  let timestamp: number | undefined;
  let timestampCount = 0;
  const signatures: string[] = [];

  for (const part of header.split(',')) {
    const separator = part.indexOf('=');
    if (separator < 1) {
      continue;
    }
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key === 't' && /^\d+$/.test(value)) {
      timestamp = Number(value);
      timestampCount += 1;
    }
    if (key === 'v1' && value !== '') {
      signatures.push(value);
    }
  }

  if (
    timestamp === undefined ||
    timestampCount !== 1 ||
    !Number.isSafeInteger(timestamp) ||
    signatures.length === 0
  ) {
    return null;
  }

  return { timestamp, signatures };
}

function assertEventEnvelope(
  value: unknown,
): asserts value is WebhookEventEnvelope<Record<string, unknown>> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Webhook payload must be a JSON object.');
  }
  const event = value as Record<string, unknown>;
  if (typeof event.event_id !== 'string' || event.event_id.trim() === '') {
    throw new TypeError('Webhook event_id must be a non-empty string.');
  }
  if (typeof event.event_type !== 'string' || event.event_type.trim() === '') {
    throw new TypeError('Webhook event_type must be a non-empty string.');
  }
  if (
    typeof event.version !== 'number' ||
    !Number.isSafeInteger(event.version) ||
    event.version < 1
  ) {
    throw new TypeError('Webhook version must be a positive integer.');
  }
  if (
    typeof event.occurred_at !== 'number' ||
    !Number.isSafeInteger(event.occurred_at) ||
    event.occurred_at < 0
  ) {
    throw new TypeError(
      'Webhook occurred_at must be a non-negative Unix timestamp.',
    );
  }
  if (
    event.data === null ||
    typeof event.data !== 'object' ||
    Array.isArray(event.data)
  ) {
    throw new TypeError('Webhook data must be an object.');
  }
}

export function assertValidWebhookSignature(
  rawBody: Buffer | string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds = DEFAULT_WEBHOOK_TOLERANCE_SECONDS,
  nowSeconds = Math.floor(Date.now() / 1000),
): void {
  if (typeof secret !== 'string' || secret.trim() === '') {
    throw new TypeError('Webhook secret must be a non-empty string.');
  }
  if (!Number.isSafeInteger(toleranceSeconds) || toleranceSeconds < 0) {
    throw new TypeError('Webhook tolerance must be a non-negative integer.');
  }
  if (typeof rawBody !== 'string' && !Buffer.isBuffer(rawBody)) {
    throw new SignatureMismatchError('Webhook rawBody is missing.');
  }

  const parsed = parseHeader(signatureHeader);
  if (!parsed) {
    throw new SignatureMismatchError(
      'Webhook signature header is missing or malformed.',
    );
  }
  if (Math.abs(nowSeconds - parsed.timestamp) > toleranceSeconds) {
    throw new TimestampSkewError(
      'Webhook timestamp is outside the allowed tolerance.',
    );
  }

  const expected = createHmac('sha256', secret)
    .update(`${parsed.timestamp}.`)
    .update(rawBody)
    .digest();

  let matched = false;
  for (const signature of parsed.signatures) {
    if (!/^[0-9a-fA-F]{64}$/.test(signature)) {
      continue;
    }
    const candidate = Buffer.from(signature, 'hex');
    if (
      candidate.length === expected.length &&
      timingSafeEqual(candidate, expected)
    ) {
      matched = true;
    }
  }

  if (!matched) {
    throw new SignatureMismatchError(
      'Webhook signature does not match payload.',
    );
  }
}

export function verifyWebhookSignature(
  rawBody: Buffer | string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds = DEFAULT_WEBHOOK_TOLERANCE_SECONDS,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  try {
    assertValidWebhookSignature(
      rawBody,
      signatureHeader,
      secret,
      toleranceSeconds,
      nowSeconds,
    );
    return true;
  } catch {
    return false;
  }
}

export function parseWebhookEvent<T = Record<string, unknown>>(
  rawBody: Buffer | string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds = DEFAULT_WEBHOOK_TOLERANCE_SECONDS,
  nowSeconds = Math.floor(Date.now() / 1000),
): WebhookEventEnvelope<T> {
  assertValidWebhookSignature(
    rawBody,
    signatureHeader,
    secret,
    toleranceSeconds,
    nowSeconds,
  );
  let parsed: unknown;
  try {
    const text = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
    parsed = JSON.parse(text);
  } catch (error) {
    throw new TypeError('Webhook payload is not valid JSON.', { cause: error });
  }
  assertEventEnvelope(parsed);
  return parsed as WebhookEventEnvelope<T>;
}

export class WebhookVerifier {
  constructor(
    private readonly secret: string,
    private readonly toleranceSeconds = DEFAULT_WEBHOOK_TOLERANCE_SECONDS,
  ) {
    if (typeof secret !== 'string' || secret.trim() === '') {
      throw new TypeError('Webhook secret must be a non-empty string.');
    }
    if (!Number.isSafeInteger(toleranceSeconds) || toleranceSeconds < 0) {
      throw new TypeError('Webhook tolerance must be a non-negative integer.');
    }
  }

  verify(
    signatureHeader: string,
    rawBody: Buffer | string,
    nowSeconds = Math.floor(Date.now() / 1000),
  ): boolean {
    return verifyWebhookSignature(
      rawBody,
      signatureHeader,
      this.secret,
      this.toleranceSeconds,
      nowSeconds,
    );
  }

  assertValid(
    signatureHeader: string,
    rawBody: Buffer | string,
    nowSeconds = Math.floor(Date.now() / 1000),
  ): void {
    assertValidWebhookSignature(
      rawBody,
      signatureHeader,
      this.secret,
      this.toleranceSeconds,
      nowSeconds,
    );
  }

  constructEvent<T = Record<string, unknown>>(
    signatureHeader: string,
    rawBody: Buffer | string,
    nowSeconds = Math.floor(Date.now() / 1000),
  ): WebhookEventEnvelope<T> {
    return parseWebhookEvent<T>(
      rawBody,
      signatureHeader,
      this.secret,
      this.toleranceSeconds,
      nowSeconds,
    );
  }
}

export function appendSeenEventId(
  seenIds: readonly string[],
  eventId: string,
  maxEntries = PAYMOS_SEEN_EVENT_IDS_LIMIT,
): { isDuplicate: boolean; nextIds: string[] } {
  const cap =
    Number.isSafeInteger(maxEntries) && maxEntries > 0
      ? maxEntries
      : PAYMOS_SEEN_EVENT_IDS_LIMIT;
  const sanitized = seenIds.filter(
    (entry): entry is string => typeof entry === 'string' && entry.length > 0,
  );
  if (sanitized.includes(eventId)) {
    return { isDuplicate: true, nextIds: sanitized };
  }
  const combined = [...sanitized, eventId];
  const nextIds =
    combined.length > cap ? combined.slice(combined.length - cap) : combined;
  return { isDuplicate: false, nextIds };
}

export async function recordAndCheckSeenEventId(
  store: PaymosWebhookStore,
  eventId: string,
  options?: { key?: string; maxEntries?: number },
): Promise<boolean> {
  const key = options?.key ?? PAYMOS_SEEN_EVENT_IDS_KEY;
  const maxEntries = options?.maxEntries ?? PAYMOS_SEEN_EVENT_IDS_LIMIT;
  const existing = await store.get<unknown>(key);
  const currentIds = Array.isArray(existing)
    ? existing.filter((item): item is string => typeof item === 'string')
    : [];
  const { isDuplicate, nextIds } = appendSeenEventId(
    currentIds,
    eventId,
    maxEntries,
  );
  if (isDuplicate) {
    return true;
  }
  await store.put(key, nextIds);
  return false;
}

function normalizeRawBody(rawBody: unknown): Buffer | string | null {
  if (typeof rawBody === 'string') {
    return rawBody.length > 0 ? rawBody : null;
  }
  if (Buffer.isBuffer(rawBody)) {
    return rawBody.length > 0 ? rawBody : null;
  }
  if (rawBody instanceof Uint8Array) {
    if (rawBody.byteLength === 0) {
      return null;
    }
    return Buffer.from(rawBody.buffer, rawBody.byteOffset, rawBody.byteLength);
  }
  return null;
}

export async function handlePaymosWebhookTrigger(
  input: HandlePaymosWebhookTriggerInput,
): Promise<WebhookEventEnvelope[]> {
  let secret: string;
  try {
    secret = validateWebhookSecret(input.webhookSecret);
  } catch {
    return [];
  }

  const rawBody = normalizeRawBody(input.rawBody);
  if (rawBody === null) {
    return [];
  }

  const signatureHeader = readWebhookSignatureHeader(input.headers);
  if (signatureHeader === '') {
    return [];
  }

  const toleranceSeconds =
    typeof input.toleranceSeconds === 'number'
      ? input.toleranceSeconds
      : DEFAULT_WEBHOOK_TOLERANCE_SECONDS;

  let event: WebhookEventEnvelope;
  try {
    event = parseWebhookEvent(
      rawBody,
      signatureHeader,
      secret,
      toleranceSeconds,
      input.nowSeconds,
    );
  } catch {
    return [];
  }

  const subscribedEvents = input.events;
  if (
    Array.isArray(subscribedEvents) &&
    subscribedEvents.length > 0 &&
    !subscribedEvents.includes('*') &&
    !subscribedEvents.includes(event.event_type)
  ) {
    return [];
  }

  if (input.store) {
    const isDuplicate = await recordAndCheckSeenEventId(
      input.store,
      event.event_id,
      {
        key: PAYMOS_SEEN_EVENT_IDS_KEY,
        maxEntries: input.maxSeenEventIds ?? PAYMOS_SEEN_EVENT_IDS_LIMIT,
      },
    );
    if (isDuplicate) {
      return [];
    }
  }

  return [event];
}
