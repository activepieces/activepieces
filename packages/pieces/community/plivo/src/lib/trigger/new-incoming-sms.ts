import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { createHmac, timingSafeEqual } from 'crypto';
import { plivoAuth } from '../..';
import {
  PlivoManagedApp,
  plivoCommon,
  provisionMessageWebhook,
  releaseMessageWebhook,
} from '../common';

const markdown = `## Plivo Incoming SMS

Selecting a phone number is enough. While the flow is enabled that number is pointed at
this flow automatically, and it is returned to the application it used before when the
flow is disabled. A Plivo number can route incoming SMS to one flow at a time.

If that number already delivers SMS somewhere else, that delivery stops while this flow
is enabled and resumes once it is disabled.

To wire it up by hand instead, leave the number empty and set the Message URL below on the
Plivo application, with method POST, then assign the number to that application in the
console at https://cx.plivo.com.
\`\`\`text
{{webhookUrl}}
\`\`\`
`;

const MANAGED_APP_STORE_KEY = '_plivo_new_incoming_sms_app';

export const plivoNewIncomingSms = createTrigger({
  auth: plivoAuth,
  name: 'new_incoming_sms',
  displayName: 'New Incoming SMS',
  description: 'Triggers when a new SMS message is received',
  aiMetadata: {
    description: 'Fires when an inbound SMS message is received on a Plivo number whose application Message URL points at this webhook. Each event represents one incoming text message with its sender, recipient, body, and metadata.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    phone_number: plivoCommon.trigger_phone_number,
    markdown: Property.MarkDown({
      value: markdown,
    }),
  },
  sampleData: {
    From: '+14151234567',
    To: '+14157654321',
    Type: 'sms',
    Text: 'Hello from Plivo!',
    MessageUUID: 'db3ce55a-7f1d-11e1-8ea7-1231380bc196',
    MessageIntent: '',
  },
  async onEnable(context) {
    const number = context.propsValue.phone_number;
    if (!number) {
      return;
    }
    const managed = await provisionMessageWebhook({
      auth: context.auth,
      number,
      webhookUrl: context.webhookUrl,
    });
    await context.store.put<PlivoManagedApp>(MANAGED_APP_STORE_KEY, managed);
  },
  async onDisable(context) {
    const managed = await context.store.get<PlivoManagedApp>(
      MANAGED_APP_STORE_KEY
    );
    if (!managed) {
      return;
    }
    // Drop the stored handle even when Plivo cleanup fails, so a later enable is not
    // blocked by state describing an application this flow no longer manages.
    try {
      await releaseMessageWebhook({ auth: context.auth, managed });
    } finally {
      await context.store.delete(MANAGED_APP_STORE_KEY);
    }
  },
  async run(context) {
    const params = context.payload.body;
    if (!isRecord(params)) {
      return [];
    }

    if (
      !isFromPlivo({
        url: context.webhookUrl,
        signedParams: paramsForSigning(
          context.payload.rawBody,
          context.payload.headers,
          params
        ),
        headers: context.payload.headers,
        authToken: context.auth.password,
      })
    ) {
      return [];
    }

    if (typeof params['Text'] !== 'string') {
      return [];
    }

    return [params];
  },
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// Plivo signs the values it put on the wire, so the signature is rebuilt from the raw
// form-encoded body rather than the parsed object. This keeps repeated keys distinct
// instead of collapsing them, and removes any dependence on how the body was parsed.
// Anything that is not form-encoded falls back to the parsed body.
function paramsForSigning(
  rawBody: unknown,
  headers: Record<string, string | undefined>,
  parsedBody: Record<string, unknown>
): Record<string, string[]> {
  const contentType = (headers['content-type'] ?? '').toLowerCase();
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const rawText = rawBodyAsText(rawBody);
    if (rawText) {
      const search = new URLSearchParams(rawText);
      const fromRaw: Record<string, string[]> = {};
      for (const key of search.keys()) {
        fromRaw[key] = search.getAll(key);
      }
      if (Object.keys(fromRaw).length > 0) {
        return fromRaw;
      }
    }
  }

  const fromParsed: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(parsedBody)) {
    fromParsed[key] = Array.isArray(value)
      ? value.map((entry) => String(entry))
      : [String(value)];
  }
  return fromParsed;
}

function rawBodyAsText(rawBody: unknown): string | undefined {
  if (typeof rawBody === 'string') {
    return rawBody;
  }
  if (Buffer.isBuffer(rawBody)) {
    return rawBody.toString('utf8');
  }
  return undefined;
}

// An inbound messaging webhook is signed under X-Plivo-Signature-Ma-V3; the plain
// X-Plivo-Signature-V3 is also present but is the voice-style value and will not match.
// A V3-family signature is authoritative when present: validate it and do NOT fall back
// to the weaker V2 scheme. V2 signs only the URL and nonce, not the POST params, so a
// fallback would accept a request with a tampered body. Use V2 only when Plivo sent no
// V3 signature at all (older accounts / Plivo's still-documented V2 scheme).
function isFromPlivo(params: {
  url: string;
  signedParams: Record<string, string[]>;
  headers: Record<string, string | undefined>;
  authToken: string;
}): boolean {
  const { url, signedParams, headers, authToken } = params;

  const v3Nonce = headers['x-plivo-signature-v3-nonce'];
  const v3Candidates = signatureCandidates(headers, [
    'x-plivo-signature-ma-v3',
    'x-plivo-signature-v3',
  ]);
  if (v3Nonce && v3Candidates.length > 0) {
    return matchesAny(
      signV3(url, signedParams, v3Nonce, authToken),
      v3Candidates
    );
  }

  const v2Nonce = headers['x-plivo-signature-v2-nonce'];
  const v2Candidates = signatureCandidates(headers, [
    'x-plivo-signature-ma-v2',
    'x-plivo-signature-v2',
  ]);
  if (v2Nonce && v2Candidates.length > 0) {
    return matchesAny(signV2(url, v2Nonce, authToken), v2Candidates);
  }

  return false;
}

function signatureCandidates(
  headers: Record<string, string | undefined>,
  headerNames: string[]
): string[] {
  return headerNames
    .map((name) => headers[name])
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

// V3 canonical string (plivo SDK signature_v3.construct_post_url): strip the URL
// query, append "?", the sorted URL-query params, a "." only if the URL carried a
// query, then the body params as a sorted separator-less key+value string.
function signV3(
  url: string,
  signedParams: Record<string, string[]>,
  nonce: string,
  authToken: string
): string {
  const parsed = new URL(url);
  const base = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  const urlQuery = [...new Set(parsed.searchParams.keys())]
    .sort()
    .map((key) =>
      parsed.searchParams
        .getAll(key)
        .sort()
        .map((value) => `${key}=${value}`)
        .join('&')
    )
    .join('&');
  const sortedParams = Object.keys(signedParams)
    .sort()
    .map((key) =>
      [...signedParams[key]]
        .sort()
        .map((value) => `${key}${value}`)
        .join('')
    )
    .join('');
  const hasUrlQuery = urlQuery.length > 0;
  const hasBody = Object.keys(signedParams).length > 0;
  let signedUrl = base;
  if (hasUrlQuery || hasBody) {
    signedUrl += `?${urlQuery}`;
  }
  if (hasUrlQuery && hasBody) {
    signedUrl += '.';
  }
  signedUrl += sortedParams;
  return createHmac('sha256', authToken)
    .update(`${signedUrl}.${nonce}`)
    .digest('base64');
}

function signV2(url: string, nonce: string, authToken: string): string {
  const parsed = new URL(url);
  const base = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  return createHmac('sha256', authToken)
    .update(`${base}${nonce}`)
    .digest('base64');
}

function matchesAny(expected: string, candidates: string[]): boolean {
  const expectedBuffer = Buffer.from(expected);
  return candidates.some((candidate) => {
    const candidateBuffer = Buffer.from(candidate);
    return (
      candidateBuffer.length === expectedBuffer.length &&
      timingSafeEqual(candidateBuffer, expectedBuffer)
    );
  });
}
