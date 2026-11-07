import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { DEDUPE_KEY_PROPERTY, Property, Store } from '@activepieces/pieces-framework';

export const webhookInstructions = (eventLabel: string): string => `
**How to connect**

1. Sign in to https://developer.ilovepdf.com/ and open your project.
2. Go to **Webhooks** and click **Add Webhook**.
3. Make up a long random secret (at least 16 letters and digits) and enter it in **Webhook Secret** below.
4. Paste the URL below into **Endpoint URL** and replace \`YOUR_SECRET\` with that secret:

\`\`\`text
{{webhookUrl}}?ap_secret=YOUR_SECRET
\`\`\`

5. In **Events**, select **${eventLabel}**.
6. Save the webhook. Deliveries without the right secret are ignored, and a repeated delivery of the same event fires the flow only once.
`;

export const toolFilterProperty = Property.StaticMultiSelectDropdown({
  displayName: 'Filter by Tool',
  description:
    'Optional. When set, only fires for tasks using one of the selected tools. Leave empty to fire for every tool.',
  required: false,
  options: {
    disabled: false,
    options: [
      { label: 'Compress PDF', value: 'compress' },
      { label: 'Merge PDF', value: 'merge' },
      { label: 'Split PDF', value: 'split' },
      { label: 'PDF to JPG', value: 'pdfjpg' },
      { label: 'JPG/Image to PDF', value: 'imagepdf' },
      { label: 'Office to PDF', value: 'officepdf' },
      { label: 'HTML to PDF', value: 'htmlpdf' },
      { label: 'OCR PDF', value: 'pdfocr' },
      { label: 'Watermark PDF', value: 'watermark' },
      { label: 'Protect PDF', value: 'protect' },
      { label: 'Unlock PDF', value: 'unlock' },
      { label: 'Page Numbers', value: 'pagenumber' },
      { label: 'Rotate PDF', value: 'rotate' },
      { label: 'Extract Text', value: 'extract' },
      { label: 'Repair PDF', value: 'repair' },
      { label: 'PDF/A', value: 'pdfa' },
      { label: 'Validate PDF/A', value: 'validatepdfa' },
      { label: 'Edit PDF', value: 'editpdf' },
      { label: 'Compress Image', value: 'compressimage' },
      { label: 'Resize Image', value: 'resizeimage' },
      { label: 'Crop Image', value: 'cropimage' },
      { label: 'Convert Image', value: 'convertimage' },
      { label: 'Upscale Image', value: 'upscaleimage' },
      { label: 'Remove Image Background', value: 'removebackgroundimage' },
      { label: 'Watermark Image', value: 'watermarkimage' },
      { label: 'Rotate Image', value: 'rotateimage' },
      { label: 'Sign PDF', value: 'sign' },
    ],
  },
});

export const webhookSecretProperty = Property.ShortText({
  displayName: 'Webhook Secret',
  description:
    'A random secret of at least 16 characters. Add it to the endpoint URL as ?ap_secret=... (see the steps above).',
  required: true,
});

export function hasValidSecret({
  queryParams,
  secret,
}: {
  queryParams: Record<string, string> | undefined;
  secret: unknown;
}): boolean {
  const expected = typeof secret === 'string' ? secret.trim() : '';
  if (expected.length < MIN_SECRET_LENGTH) {
    throw new Error(`Webhook Secret must be at least ${MIN_SECRET_LENGTH} characters long.`);
  }
  const given = queryParams?.[SECRET_PARAM];
  if (typeof given !== 'string' || given === '') return false;
  return timingSafeEqual(digest(expected), digest(given));
}

export function dedupeKeyOf(envelope: WebhookEnvelope): string {
  const task = envelope.data?.task;
  const signature = envelope.data?.signature;
  const signer = envelope.data?.signer;
  const parts = [
    envelope.event,
    task?.['task'],
    signature?.['uuid'] ?? signature?.['token_requester'],
    signer?.['uuid'] ?? signer?.['token_signer'],
  ].filter((part) => typeof part === 'string' && part !== '');
  if (parts.length > 1) return parts.join(':');
  return createHash('sha256').update(JSON.stringify(envelope)).digest('hex');
}

export async function claimDelivery({ store, key }: { store: Store; key: string }): Promise<boolean> {
  const now = Date.now();
  const seen = ((await store.get<SeenDelivery[]>(SEEN_STORE_KEY)) ?? []).filter(
    (entry) => now - entry.at < SEEN_TTL_MS
  );
  if (seen.some((entry) => entry.key === key)) return false;
  const claim = randomUUID();
  await store.put<SeenDelivery[]>(SEEN_STORE_KEY, [...seen, { key, at: now, claim }].slice(-MAX_SEEN));
  const stored = (await store.get<SeenDelivery[]>(SEEN_STORE_KEY)) ?? [];
  return stored.some((entry) => entry.key === key && entry.claim === claim);
}

export async function acceptDelivery({
  envelope,
  store,
  queryParams,
  secret,
}: {
  envelope: WebhookEnvelope;
  store: Store;
  queryParams: Record<string, string> | undefined;
  secret: unknown;
}): Promise<unknown[]> {
  if (!hasValidSecret({ queryParams, secret })) return [];
  const key = dedupeKeyOf(envelope);
  if (!(await claimDelivery({ store, key }))) return [];
  return [{ ...envelope, [DEDUPE_KEY_PROPERTY]: `iloveapi:${key}` }];
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

const SECRET_PARAM = 'ap_secret';
const MIN_SECRET_LENGTH = 16;
const SEEN_STORE_KEY = 'iloveapi_seen_deliveries';
const SEEN_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_SEEN = 500;

type SeenDelivery = { key: string; at: number; claim?: string };

type WebhookEnvelope = {
  event?: string;
  data?: {
    task?: { tool?: string } & Record<string, unknown>;
    signature?: Record<string, unknown>;
    signer?: Record<string, unknown>;
  } & Record<string, unknown>;
} & Record<string, unknown>;

export function extractEnvelope(body: unknown): WebhookEnvelope | null {
  if (!body || typeof body !== 'object') return null;
  return body as WebhookEnvelope;
}

export function matchesEvent({
  body,
  expectedEvent,
}: {
  body: unknown;
  expectedEvent: string;
}): WebhookEnvelope | null {
  const envelope = extractEnvelope(body);
  if (!envelope) return null;
  if (envelope.event !== expectedEvent) return null;
  return envelope;
}

export function matchesToolFilter({
  envelope,
  tools,
}: {
  envelope: WebhookEnvelope;
  tools?: string[] | null;
}): boolean {
  if (!tools || tools.length === 0) return true;
  const tool = envelope.data?.task?.tool;
  if (!tool) return false;
  return tools.includes(tool);
}
