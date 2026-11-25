import { createHmac } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extractPaymosCredentials,
  parseProblemDetails,
  PaymosApiError,
  PaymosClient,
  validatePaymentApiCredentials,
} from '../src/lib/common/client';
import {
  authorizationHeader,
  canonicalizeQuery,
  encodePathSegment,
  sha256Hex,
  signRequest,
  stringToSign,
} from '../src/lib/common/signing';
import {
  assertValidWebhookSignature,
  handlePaymosWebhookTrigger,
  PAYMOS_CANONICAL_WEBHOOK_EVENTS,
  PAYMOS_SEEN_EVENT_IDS_KEY,
  PAYMOS_SEEN_EVENT_IDS_LIMIT,
  SignatureMismatchError,
  TimestampSkewError,
  verifyWebhookSignature,
  WebhookVerifier,
  type PaymosWebhookStore,
} from '../src/lib/common/webhooks';

const testDir = dirname(fileURLToPath(import.meta.url));
const monorepoContractPath = resolve(testDir, '../../sdk-conformance/contract.json');
const contractPath = existsSync(monorepoContractPath)
  ? monorepoContractPath
  : resolve(testDir, './fixtures/contract.json');

interface SigningVector {
  api_key: string;
  api_secret: string;
  timestamp: string;
  method: string;
  path: string;
  query: string;
  body: string;
  body_sha256?: string;
  signature: string;
  authorization?: string;
}

interface TonWebhookVector {
  name: string;
  event_id: string;
  event_type: string;
  version: number;
  header: string;
  raw_body: string;
  expect: Array<{ path: string[]; value: string | boolean | number }>;
}

interface ConformanceContract {
  vectors: {
    post_signing: SigningVector & {
      authorization: string;
      body_sha256: string;
    };
    post_empty_body_signing: SigningVector & {
      authorization: string;
      body_sha256: string;
    };
    get_query_signing: SigningVector;
    webhook: {
      secret: string;
      timestamp: number;
      now: number;
      tolerance_seconds: number;
      raw_body: string;
      signature: string;
      header: string;
    };
    ton_webhooks: {
      secret: string;
      now: number;
      vectors: TonWebhookVector[];
    };
    problem_details: {
      flat: {
        type: string;
        title: string;
        status: number;
        detail: string;
        code: string;
        field: string;
      };
      multi: {
        type: string;
        title: string;
        status: number;
        detail: string;
        code: string;
        errors: Array<{ code: string; field: string; message: string }>;
      };
    };
  };
}

const contract = JSON.parse(
  readFileSync(contractPath, 'utf8'),
) as ConformanceContract;

function signWebhook(
  secret: string,
  timestamp: number,
  rawBody: string | Buffer,
): string {
  return createHmac('sha256', secret)
    .update(`${timestamp}.`)
    .update(rawBody)
    .digest('hex');
}

function createMemoryStore(): PaymosWebhookStore & {
  data: Map<string, unknown>;
} {
  const data = new Map<string, unknown>();
  return {
    data,
    async get<T = unknown>(key: string): Promise<T | null> {
      return data.has(key) ? (data.get(key) as T) : null;
    },
    async put<T = unknown>(key: string, value: T): Promise<T> {
      data.set(key, value);
      return value;
    },
  };
}

interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

function createMockFetch(
  status: number,
  responseBody: unknown,
): {
  fetchImpl: typeof fetch;
  calls: CapturedRequest[];
} {
  const calls: CapturedRequest[] = [];
  const fetchImpl = (async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    const url = typeof input === 'string' ? input : input.toString();
    const headers: Record<string, string> = {};
    if (init?.headers && typeof init.headers === 'object') {
      for (const [k, v] of Object.entries(
        init.headers as Record<string, string>,
      )) {
        headers[k] = v;
      }
    }
    calls.push({
      url,
      method: init?.method ?? 'GET',
      headers,
      body: typeof init?.body === 'string' ? init.body : undefined,
    });
    const text =
      typeof responseBody === 'string'
        ? responseBody
        : JSON.stringify(responseBody);
    return {
      status,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: async () => text,
    } as Response;
  }) as typeof fetch;

  return { fetchImpl, calls };
}

describe('Paymos Activepieces piece — HMAC-SHA256 signing conformance', () => {
  it('matches POST JSON body golden signing vector', () => {
    const vector = contract.vectors.post_signing;
    expect(sha256Hex(vector.body)).toBe(vector.body_sha256);
    expect(
      stringToSign(
        vector.timestamp,
        vector.method,
        vector.path,
        vector.query,
        vector.body,
      ),
    ).toBe(
      `${vector.timestamp}\nPOST\n${vector.path}\n\n${vector.body_sha256}`,
    );
    expect(
      authorizationHeader(
        vector.api_key,
        vector.api_secret,
        vector.timestamp,
        vector.method,
        vector.path,
        vector.query,
        vector.body,
      ),
    ).toBe(vector.authorization);

    const signed = signRequest({
      method: vector.method,
      path: vector.path,
      query: vector.query,
      body: vector.body,
      publicKey: vector.api_key,
      secretKey: vector.api_secret,
      timestamp: vector.timestamp,
    });
    expect(signed).toEqual({
      Authorization: vector.authorization,
      'X-Request-Timestamp': vector.timestamp,
    });
  });

  it('signs POST empty body as empty string rather than sha256("")', () => {
    const vector = contract.vectors.post_empty_body_signing;
    expect(sha256Hex('')).toBe('');
    expect(sha256Hex(Buffer.alloc(0))).toBe('');
    expect(sha256Hex(vector.body)).toBe(vector.body_sha256);
    expect(
      authorizationHeader(
        vector.api_key,
        vector.api_secret,
        vector.timestamp,
        vector.method,
        vector.path,
        vector.query,
        vector.body,
      ),
    ).toBe(vector.authorization);
  });

  it('matches GET canonical RFC 3986 query signing vector with leading ?', () => {
    const vector = contract.vectors.get_query_signing;
    const canonical = canonicalizeQuery({
      status: ['paid_over', 'paid'],
      project_id: 'prj/a',
      limit: 50,
    });
    expect(canonical).toBe(vector.query);

    const signed = signRequest({
      method: vector.method,
      path: vector.path,
      query: {
        status: ['paid_over', 'paid'],
        project_id: 'prj/a',
        limit: 50,
      },
      body: vector.body,
      publicKey: vector.api_key,
      secretKey: vector.api_secret,
      timestamp: vector.timestamp,
    });
    expect(signed.Authorization).toBe(
      `HMAC-SHA256 ${vector.api_key}:${vector.signature}`,
    );
    expect(signed['X-Request-Timestamp']).toBe(vector.timestamp);
  });

  it('encodes RFC 3986 reserved characters and rejects empty query values', () => {
    expect(encodePathSegment("inv/1 !'()*")).toBe('inv%2F1%20%21%27%28%29%2A');
    expect(canonicalizeQuery({ a: "x!*'()" })).toBe('?a=x%21%2A%27%28%29');
    expect(canonicalizeQuery({})).toBe('');
    expect(() => canonicalizeQuery({ status: [] })).toThrow(TypeError);
    expect(() => canonicalizeQuery({ project_id: '' })).toThrow(TypeError);
  });
});

describe('Paymos Activepieces piece — key prefix, HTTPS, and sandbox guards', () => {
  it('rejects rk_ payout keys before any network call', async () => {
    const { fetchImpl, calls } = createMockFetch(200, {});
    const livePayoutClient = new PaymosClient(
      {
        publicKey: 'rk_live_payout_secret_123',
        secretKey: 'sk_live_secret',
      },
      { fetchImpl },
    );
    await expect(livePayoutClient.listInvoices()).rejects.toThrow(/rk_/);
    expect(calls).toHaveLength(0);

    const testPayoutClient = new PaymosClient(
      {
        publicKey: 'rk_test_payout_secret_123',
        secretKey: 'sk_test_secret',
      },
      { fetchImpl },
    );
    await expect(testPayoutClient.validateCredentials()).rejects.toThrow(/rk_/);
    expect(calls).toHaveLength(0);
  });

  it('rejects unknown key prefixes, missing secrets, and non-HTTPS non-loopback baseUrl', () => {
    expect(() =>
      validatePaymentApiCredentials({
        publicKey: 'sk_live_wrong',
        secretKey: 'sk_secret',
      }),
    ).toThrow(/pk_live_/);

    expect(() =>
      validatePaymentApiCredentials({
        publicKey: 'pk_test_abc',
        secretKey: '   ',
      }),
    ).toThrow(/Secret Key/);

    expect(() =>
      validatePaymentApiCredentials({
        publicKey: 'pk_test_abc',
        secretKey: 'sk_test_xyz',
        baseUrl: 'http://api.paymos.io',
      }),
    ).toThrow(/HTTPS/);

    const loopback = validatePaymentApiCredentials({
      publicKey: 'pk_test_abc',
      secretKey: 'sk_test_xyz',
      baseUrl: 'http://127.0.0.1:8080/',
    });
    expect(loopback.baseUrl).toBe('http://127.0.0.1:8080');
    expect(loopback.environment).toBe('sandbox');

    const prod = validatePaymentApiCredentials({
      publicKey: 'pk_live_abc',
      secretKey: 'sk_live_xyz',
      baseUrl: 'https://api.paymos.io/',
    });
    expect(prod.baseUrl).toBe('https://api.paymos.io');
    expect(prod.environment).toBe('production');
  });

  it('rejects /v1/sandbox/* calls with pk_live_ before any network call', async () => {
    const { fetchImpl, calls } = createMockFetch(200, {});
    const prodClient = new PaymosClient(
      {
        publicKey: 'pk_live_prod_123',
        secretKey: 'sk_live_secret_123',
      },
      { fetchImpl },
    );

    await expect(
      prodClient.simulateSandboxInvoice({
        invoice_id: 'inv_123',
        stage: 'paid',
      }),
    ).rejects.toThrow(/pk_test_/);
    expect(calls).toHaveLength(0);

    await expect(
      prodClient.request({
        method: 'POST',
        path: '/v1/sandbox/invoices/inv_123/simulate-payment',
        body: { stage: 'paid' },
      }),
    ).rejects.toThrow(/pk_test_/);
    expect(calls).toHaveLength(0);
  });

  it('extracts credentials from both Activepieces context.auth.props and flat auth shapes', () => {
    expect(
      extractPaymosCredentials({
        type: 'CUSTOM_AUTH',
        props: {
          publicKey: 'pk_test_1',
          secretKey: 'sk_test_1',
          webhookSecret: 'whsec_1',
        },
      }),
    ).toEqual({
      publicKey: 'pk_test_1',
      secretKey: 'sk_test_1',
      webhookSecret: 'whsec_1',
    });

    expect(
      extractPaymosCredentials({
        publicKey: 'pk_live_1',
        secretKey: 'sk_live_1',
      }),
    ).toEqual({
      publicKey: 'pk_live_1',
      secretKey: 'sk_live_1',
    });
  });
});

describe('Paymos Activepieces piece — RFC 9457 Problem Details conformance', () => {
  it('parses flat problem_details vector without losing code or field', () => {
    const flat = contract.vectors.problem_details.flat;
    const raw = JSON.stringify(flat);
    const parsed = parseProblemDetails(raw);
    expect(parsed).toEqual(flat);

    const err = new PaymosApiError(flat.status, raw);
    expect(err.status).toBe(409);
    expect(err.code).toBe('conflict');
    expect(err.field).toBe('client_request_id');
    expect(err.detail).toBe('Conflict.');
    expect(err.errors).toEqual([]);
  });

  it('parses multi problem_details vector and preserves top-level code without promoting errors[0].code', async () => {
    const multi = contract.vectors.problem_details.multi;
    const raw = JSON.stringify(multi);
    const parsed = parseProblemDetails(raw);
    expect(parsed?.code).toBe('validation_failed');
    expect(parsed?.errors).toEqual(multi.errors);

    const { fetchImpl } = createMockFetch(multi.status, multi);
    const client = new PaymosClient(
      {
        publicKey: 'pk_test_key',
        secretKey: 'sk_test_secret',
      },
      { fetchImpl, now: () => 1_700_000_000_000 },
    );

    let thrown: unknown;
    try {
      await client.getInvoice('inv_bad');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(PaymosApiError);
    const apiError = thrown as PaymosApiError;
    expect(apiError.status).toBe(400);
    expect(apiError.code).toBe('validation_failed');
    expect(apiError.code).not.toBe('field_required');
    expect(apiError.field).toBeNull();
    expect(apiError.detail).toBe('Validation failed.');
    expect(apiError.errors).toEqual([
      {
        code: 'field_required',
        field: 'address',
        message: 'Required.',
      },
    ]);
  });
});

describe('Paymos Activepieces piece — 8 Payment API operations & strict DTOs', () => {
  const testCreds = {
    publicKey: 'pk_test_key',
    secretKey: 'sk_test_secret',
  };

  it('createInvoice sends exact fields, omits ttl, and rejects wgt_ external_order_id', async () => {
    const { fetchImpl, calls } = createMockFetch(201, {
      invoice_id: 'inv_1',
      payment_url: 'https://pay.paymos.io/i/inv_1',
    });
    const client = new PaymosClient(testCreds, {
      fetchImpl,
      now: () => 1_700_000_000_000,
    });

    await expect(
      client.createInvoice({
        project_id: 'prj_1',
        amount: '49.95',
        currency: 'USD',
        external_order_id: 'wgt_forbidden',
      }),
    ).rejects.toThrow(/wgt_/);
    expect(calls).toHaveLength(0);

    const result = await client.createInvoice({
      project_id: 'prj_1',
      amount: '49.95',
      currency: 'USD',
      external_order_id: 'order-100',
      network: 'TRC20',
      customer_fee_percent: 50,
      client_id: 'cust-7',
    });

    expect(result.invoice_id).toBe('inv_1');
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('https://api.paymos.io/v1/invoices');
    const body = JSON.parse(calls[0].body ?? '{}') as Record<string, unknown>;
    expect(body).toEqual({
      project_id: 'prj_1',
      amount: '49.95',
      currency: 'USD',
      external_order_id: 'order-100',
      network: 'TRC20',
      customer_fee_percent: 50,
      client_id: 'cust-7',
    });
    expect(body).not.toHaveProperty('ttl');
  });

  it('getInvoice, listInvoices, cancelInvoice, simulateSandboxInvoice, createPaymentChannel, getPaymentChannel, validateCredentials', async () => {
    const { fetchImpl, calls } = createMockFetch(200, { ok: true });
    const client = new PaymosClient(testCreds, {
      fetchImpl,
      now: () => 1_700_000_000_000,
    });

    await client.getInvoice('inv/1');
    expect(calls[0].url).toBe('https://api.paymos.io/v1/invoices/inv%2F1');

    await client.listInvoices({
      project_id: 'prj/a',
      status: ['paid_over', 'paid'],
      limit: 50,
    });
    expect(calls[1].url).toBe(
      'https://api.paymos.io/v1/invoices?limit=50&project_id=prj%2Fa&status=paid&status=paid_over',
    );
    expect(calls[1].headers.Authorization).toBe(
      `HMAC-SHA256 ${contract.vectors.get_query_signing.api_key}:${contract.vectors.get_query_signing.signature}`,
    );

    await expect(
      client.cancelInvoice({ invoice_id: 'inv_1', reason: '   ' }),
    ).rejects.toThrow(/reason/);
    await expect(
      client.cancelInvoice({ invoice_id: 'inv_1', reason: 'x'.repeat(501) }),
    ).rejects.toThrow(/500/);

    await client.cancelInvoice({
      invoice_id: 'inv_1',
      reason: 'Customer cancelled',
    });
    expect(calls[2].url).toBe('https://api.paymos.io/v1/invoices/inv_1/cancel');
    expect(JSON.parse(calls[2].body ?? '{}')).toEqual({
      reason: 'Customer cancelled',
    });

    await client.simulateSandboxInvoice({
      invoice_id: 'inv_1',
      stage: 'overpaid',
    });
    expect(calls[3].url).toBe(
      'https://api.paymos.io/v1/sandbox/invoices/inv_1/simulate-payment',
    );
    expect(JSON.parse(calls[3].body ?? '{}')).toEqual({ stage: 'overpaid' });

    await client.createPaymentChannel({
      project_id: 'prj_1',
      external_id: 'cust-42',
    });
    expect(calls[4].url).toBe('https://api.paymos.io/v1/payment-channels');
    expect(JSON.parse(calls[4].body ?? '{}')).toEqual({
      project_id: 'prj_1',
      external_id: 'cust-42',
    });

    await client.getPaymentChannel('pch/9');
    expect(calls[5].url).toBe(
      'https://api.paymos.io/v1/payment-channels/pch%2F9',
    );

    await client.validateCredentials();
    expect(calls[6].url).toBe('https://api.paymos.io/v1/invoices?limit=1');
  });

  it('createRefund sends STRICTLY { invoice_id, mode, external_order_id } with no unmapped fields', async () => {
    const { fetchImpl, calls } = createMockFetch(201, {
      withdrawal_id: 'wdr_1',
      invoice_id: 'inv_1',
      mode: 'overpayment',
    });
    const client = new PaymosClient(testCreds, {
      fetchImpl,
      now: () => 1_700_000_000_000,
    });

    await expect(
      client.createRefund({
        invoice_id: 'inv_1',
        mode: 'partial' as 'full',
        external_order_id: 'ref-bad',
      }),
    ).rejects.toThrow(/mode/);
    expect(calls).toHaveLength(0);

    await client.createRefund({
      invoice_id: 'inv_74BPZFhr9qy9Uz2fbRkdJX',
      mode: 'overpayment',
      external_order_id: 'refund-order-2',
      // Extra fields intentionally injected via cast to prove strict serialization strips them
      ...({
        amount: '10.00',
        currency: 'USDT',
        network: 'TRC20',
        destination_address: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
      } as Record<string, unknown>),
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('https://api.paymos.io/v1/refunds');
    const body = JSON.parse(calls[0].body ?? '{}') as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual([
      'external_order_id',
      'invoice_id',
      'mode',
    ]);
    expect(body).toEqual({
      invoice_id: 'inv_74BPZFhr9qy9Uz2fbRkdJX',
      mode: 'overpayment',
      external_order_id: 'refund-order-2',
    });
  });
});

describe('Paymos Activepieces piece — webhook verification, 18 events, FIFO dedup, fail-closed trigger', () => {
  it('exposes exactly the 18 canonical Paymos events without phantom events', () => {
    expect(PAYMOS_CANONICAL_WEBHOOK_EVENTS).toHaveLength(18);
    expect(new Set(PAYMOS_CANONICAL_WEBHOOK_EVENTS).size).toBe(18);
    expect(PAYMOS_CANONICAL_WEBHOOK_EVENTS).not.toContain('invoice.created');
    expect(PAYMOS_CANONICAL_WEBHOOK_EVENTS).toContain('invoice.paid');
    expect(PAYMOS_CANONICAL_WEBHOOK_EVENTS).toContain('invoice.paid_late');
    expect(PAYMOS_CANONICAL_WEBHOOK_EVENTS).toContain(
      'payment_channel.deposit.confirmed',
    );
    expect(PAYMOS_CANONICAL_WEBHOOK_EVENTS).toContain(
      'withdrawal.completion_rewound',
    );
  });

  it('verifies contract.json dual-signature webhook and all 16 TON v1/v2 webhook vectors', () => {
    const dual = contract.vectors.webhook;
    const verifier = new WebhookVerifier(dual.secret, dual.tolerance_seconds);
    expect(verifier.verify(dual.header, dual.raw_body, dual.now)).toBe(true);
    expect(
      verifier.verify(
        dual.header,
        Buffer.from(dual.raw_body, 'utf8'),
        dual.now,
      ),
    ).toBe(true);

    const ton = contract.vectors.ton_webhooks;
    expect(ton.vectors).toHaveLength(16);
    const tonVerifier = new WebhookVerifier(ton.secret);
    for (const vector of ton.vectors) {
      expect(tonVerifier.verify(vector.header, vector.raw_body, ton.now)).toBe(
        true,
      );
      const parsed = tonVerifier.constructEvent(
        vector.header,
        vector.raw_body,
        ton.now,
      );
      expect(parsed.event_id).toBe(vector.event_id);
      expect(parsed.event_type).toBe(vector.event_type);
      expect(parsed.version).toBe(vector.version);
      expect(
        tonVerifier.verify(vector.header, `${vector.raw_body} `, ton.now),
      ).toBe(false);
    }
  });

  it('enforces exact 300-second replay window boundaries', () => {
    const dual = contract.vectors.webhook;
    expect(
      verifyWebhookSignature(
        dual.raw_body,
        dual.header,
        dual.secret,
        300,
        dual.now + 300,
      ),
    ).toBe(true);
    expect(
      verifyWebhookSignature(
        dual.raw_body,
        dual.header,
        dual.secret,
        300,
        dual.now - 300,
      ),
    ).toBe(true);
    expect(() =>
      assertValidWebhookSignature(
        dual.raw_body,
        dual.header,
        dual.secret,
        300,
        dual.now + 301,
      ),
    ).toThrow(TimestampSkewError);
    expect(() =>
      assertValidWebhookSignature(
        dual.raw_body,
        dual.header,
        dual.secret,
        300,
        dual.now - 301,
      ),
    ).toThrow(TimestampSkewError);
    expect(() =>
      assertValidWebhookSignature(
        `${dual.raw_body} `,
        dual.header,
        dual.secret,
        300,
        dual.now,
      ),
    ).toThrow(SignatureMismatchError);
  });

  it('accepts valid dual-signature webhook once and deduplicates repeat via context.store', async () => {
    const dual = contract.vectors.webhook;
    const store = createMemoryStore();

    const first = await handlePaymosWebhookTrigger({
      rawBody: Buffer.from(dual.raw_body, 'utf8'),
      headers: { 'X-Webhook-Signature': dual.header },
      webhookSecret: dual.secret,
      events: ['invoice.paid'],
      store,
      nowSeconds: dual.now,
    });

    expect(first).toHaveLength(1);
    expect(first[0].event_id).toBe('evt_123');
    expect(first[0].event_type).toBe('invoice.paid');
    expect(store.data.get(PAYMOS_SEEN_EVENT_IDS_KEY)).toEqual(['evt_123']);

    // Repeat delivery with identical event_id must be suppressed
    const repeat = await handlePaymosWebhookTrigger({
      rawBody: dual.raw_body,
      headers: { 'x-webhook-signature': dual.header },
      webhookSecret: dual.secret,
      events: ['invoice.paid'],
      store,
      nowSeconds: dual.now,
    });

    expect(repeat).toEqual([]);
    expect(store.data.get(PAYMOS_SEEN_EVENT_IDS_KEY)).toEqual(['evt_123']);
  });

  it('enforces bounded FIFO eviction at 500 seen event_ids in context.store', async () => {
    const secret = 'whsec_fifo_test_secret';
    const now = 1_700_000_000;
    const store = createMemoryStore();

    const makeDelivery = (index: number) => {
      const rawBody = JSON.stringify({
        event_id: `evt_${index}`,
        event_type: 'invoice.paid',
        version: 1,
        occurred_at: now,
        data: { invoice_id: `inv_${index}` },
      });
      const sig = signWebhook(secret, now, rawBody);
      return {
        rawBody,
        headers: { 'x-webhook-signature': `t=${now},v1=${sig}` },
      };
    };

    for (let i = 1; i <= PAYMOS_SEEN_EVENT_IDS_LIMIT; i += 1) {
      const delivery = makeDelivery(i);
      const emitted = await handlePaymosWebhookTrigger({
        ...delivery,
        webhookSecret: secret,
        events: ['*'],
        store,
        nowSeconds: now,
      });
      expect(emitted).toHaveLength(1);
    }

    const storedAt500 = store.data.get(PAYMOS_SEEN_EVENT_IDS_KEY) as string[];
    expect(storedAt500).toHaveLength(500);
    expect(storedAt500[0]).toBe('evt_1');
    expect(storedAt500[499]).toBe('evt_500');

    // 501st distinct event evicts evt_1 (FIFO) and retains evt_2..evt_501
    const delivery501 = makeDelivery(501);
    const emitted501 = await handlePaymosWebhookTrigger({
      ...delivery501,
      webhookSecret: secret,
      events: ['*'],
      store,
      nowSeconds: now,
    });
    expect(emitted501).toHaveLength(1);

    const storedAt501 = store.data.get(PAYMOS_SEEN_EVENT_IDS_KEY) as string[];
    expect(storedAt501).toHaveLength(500);
    expect(storedAt501[0]).toBe('evt_2');
    expect(storedAt501[499]).toBe('evt_501');

    // Repeating evt_501 is still deduplicated
    const repeat501 = await handlePaymosWebhookTrigger({
      ...delivery501,
      webhookSecret: secret,
      events: ['*'],
      store,
      nowSeconds: now,
    });
    expect(repeat501).toEqual([]);
  });

  it('rejects fail-closed (returns []) on missing rawBody, bad signature, expired timestamp, wrong secret, or non-matching event filter', async () => {
    const dual = contract.vectors.webhook;
    const store = createMemoryStore();

    // Missing rawBody (undefined, null, empty, parsed JSON object)
    for (const badRawBody of [
      undefined,
      null,
      '',
      Buffer.alloc(0),
      JSON.parse(dual.raw_body),
    ]) {
      expect(
        await handlePaymosWebhookTrigger({
          rawBody: badRawBody,
          headers: { 'x-webhook-signature': dual.header },
          webhookSecret: dual.secret,
          events: ['*'],
          store,
          nowSeconds: dual.now,
        }),
      ).toEqual([]);
    }

    // Missing or non-whsec_ secret
    for (const badSecret of [undefined, '', 'plain_secret_no_prefix']) {
      expect(
        await handlePaymosWebhookTrigger({
          rawBody: dual.raw_body,
          headers: { 'x-webhook-signature': dual.header },
          webhookSecret: badSecret,
          events: ['*'],
          store,
          nowSeconds: dual.now,
        }),
      ).toEqual([]);
    }

    // Missing signature header
    expect(
      await handlePaymosWebhookTrigger({
        rawBody: dual.raw_body,
        headers: {},
        webhookSecret: dual.secret,
        events: ['*'],
        store,
        nowSeconds: dual.now,
      }),
    ).toEqual([]);

    // Invalid signature
    expect(
      await handlePaymosWebhookTrigger({
        rawBody: dual.raw_body,
        headers: {
          'x-webhook-signature': `t=${dual.now},v1=${'a'.repeat(64)}`,
        },
        webhookSecret: dual.secret,
        events: ['*'],
        store,
        nowSeconds: dual.now,
      }),
    ).toEqual([]);

    // Expired timestamp (> 300s)
    expect(
      await handlePaymosWebhookTrigger({
        rawBody: dual.raw_body,
        headers: { 'x-webhook-signature': dual.header },
        webhookSecret: dual.secret,
        events: ['*'],
        store,
        nowSeconds: dual.now + 301,
      }),
    ).toEqual([]);

    // Future timestamp (> 300s)
    expect(
      await handlePaymosWebhookTrigger({
        rawBody: dual.raw_body,
        headers: { 'x-webhook-signature': dual.header },
        webhookSecret: dual.secret,
        events: ['*'],
        store,
        nowSeconds: dual.now - 301,
      }),
    ).toEqual([]);

    // Non-matching event filter
    expect(
      await handlePaymosWebhookTrigger({
        rawBody: dual.raw_body,
        headers: { 'x-webhook-signature': dual.header },
        webhookSecret: dual.secret,
        events: ['invoice.expired', 'withdrawal.completed'],
        store,
        nowSeconds: dual.now,
      }),
    ).toEqual([]);

    // Store was never polluted by rejected or filtered deliveries
    expect(store.data.size).toBe(0);
  });
});

describe('Paymos Activepieces piece — static packaging contract', () => {
  const pieceRoot = resolve(testDir, '..');
  const sourceFiles = [
    'package.json',
    'tsconfig.json',
    'vitest.config.ts',
    'README.md',
    'src/index.ts',
    'src/lib/common/signing.ts',
    'src/lib/common/webhooks.ts',
    'src/lib/common/client.ts',
    'src/lib/actions/index.ts',
    'src/lib/triggers/webhook-event.ts',
  ];

  it('uses standard TS imports without .ts extensions and keeps pure modules framework-free', () => {
    const tsExtImportPattern = /from\s+['"][^'"]+\.ts['"]/;

    for (const relPath of sourceFiles) {
      const content = readFileSync(resolve(pieceRoot, relPath), 'utf8');
      if (relPath.endsWith('.ts')) {
        expect(tsExtImportPattern.test(content)).toBe(false);
      }
      if (relPath.startsWith('src/lib/common/')) {
        expect(content).not.toContain('@activepieces/');
      }
    }
  });

  it('declares required piece metadata, all 8 actions, and manual-registration webhook trigger', () => {
    const indexSrc = readFileSync(resolve(pieceRoot, 'src/index.ts'), 'utf8');
    expect(indexSrc).toContain("displayName: 'Paymos'");
    expect(indexSrc).toContain(
      'https://raw.githubusercontent.com/Paymos-labs/mcp/v1.11.1/assets/logo-256.png',
    );
    expect(indexSrc).toContain("authors: ['paymos-dev']");
    expect(indexSrc).toContain('PieceCategory.PAYMENT_PROCESSING');

    const actionsSrc = readFileSync(
      resolve(pieceRoot, 'src/lib/actions/index.ts'),
      'utf8',
    );
    for (const actionName of [
      'create_invoice',
      'get_invoice',
      'list_invoices',
      'cancel_invoice',
      'simulate_sandbox_invoice',
      'create_payment_channel',
      'get_payment_channel',
      'create_refund',
    ]) {
      expect(actionsSrc).toContain(`name: '${actionName}'`);
    }

    const triggerSrc = readFileSync(
      resolve(pieceRoot, 'src/lib/triggers/webhook-event.ts'),
      'utf8',
    );
    expect(triggerSrc).toContain("name: 'paymos_webhook_event'");
    expect(triggerSrc).toContain('handlePaymosWebhookTrigger');
    expect(triggerSrc).toContain('Paymos Dashboard → Developer → Webhooks');
  });
});
