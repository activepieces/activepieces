import { createHmac, timingSafeEqual } from 'crypto';

// Plivo sends several signature headers on one callback and only the one matching the
// channel verifies. Inbound messaging is signed under X-Plivo-Signature-Ma-V3, while
// voice callbacks (answer, hangup, fallback) and message status callbacks are signed
// under the plain X-Plivo-Signature-V3. Checking the wrong one rejects every genuine
// request, which Plivo reports back as message error code 2403.
export type PlivoChannel = 'messaging' | 'voice';

const V3_HEADERS: Record<PlivoChannel, string[]> = {
  messaging: ['x-plivo-signature-ma-v3', 'x-plivo-signature-v3'],
  voice: ['x-plivo-signature-v3', 'x-plivo-signature-ma-v3'],
};

const V2_HEADERS: Record<PlivoChannel, string[]> = {
  messaging: ['x-plivo-signature-ma-v2', 'x-plivo-signature-v2'],
  voice: ['x-plivo-signature-v2', 'x-plivo-signature-ma-v2'],
};

// A V3 family signature is preferred, and V2 is only consulted when no V3 signature
// matched. V2 covers just the URL and nonce rather than the body, so it is the weaker of
// the two, but it is the only scheme that verifies on a subaccount whose messaging
// signatures were generated with the main account token.
export function isFromPlivo(params: {
  urlCandidates: string[];
  signedParams: Record<string, string[]>;
  headers: Record<string, string | undefined>;
  authToken: string;
  channel: PlivoChannel;
}): boolean {
  const { urlCandidates, signedParams, headers, authToken, channel } = params;

  const urls = urlCandidates.filter(isAbsoluteUrl);
  if (urls.length === 0) {
    return false;
  }

  const v3Nonce = headers['x-plivo-signature-v3-nonce'];
  const v3Candidates = signatureCandidates(headers, V3_HEADERS[channel]);
  if (v3Nonce && v3Candidates.length > 0) {
    if (
      urls.some((url) =>
        matchesAny(signV3(url, signedParams, v3Nonce, authToken), v3Candidates)
      )
    ) {
      return true;
    }
  }

  const v2Nonce = headers['x-plivo-signature-v2-nonce'];
  const v2Candidates = signatureCandidates(headers, V2_HEADERS[channel]);
  if (v2Nonce && v2Candidates.length > 0) {
    return urls.some((url) =>
      matchesAny(signV2(url, v2Nonce, authToken), v2Candidates)
    );
  }

  return false;
}

// Plivo signs the URL it actually requested. Activepieces hands a trigger the plain
// webhook path, while a voice answer URL is registered as the synchronous variant, so
// every URL the flow could have been reached on is offered here.
export function webhookUrlCandidates(webhookUrl: string): string[] {
  const trimmed = (webhookUrl ?? '').replace(/\/+$/, '');
  if (trimmed.length === 0) {
    return [];
  }
  return [trimmed, `${trimmed}/sync`];
}

// Activepieces passes an empty webhook URL to the run hook on its synchronous route, so a
// candidate can be unusable. An unusable candidate is skipped rather than thrown, because
// throwing out of verification would fail the request for a reason unrelated to the signature.
function isAbsoluteUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function paramsForSigning(
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

// V3 canonical string (plivo SDK signature_v3.construct_post_url): strip the URL query,
// append "?", the sorted URL query params, a "." only if the URL carried a query, then the
// body params as a sorted separator-less key and value string.
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
  // KB section 2: the "?" is appended unconditionally, and a "." follows the query only
  // when the URL carried one. Gating either on the body being non empty produces a
  // different digest for an empty body and rejects a genuine callback.
  let signedUrl = `${base}?${urlQuery}`;
  if (urlQuery.length > 0) {
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
