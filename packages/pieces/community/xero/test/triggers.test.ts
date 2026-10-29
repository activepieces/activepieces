import { createHmac } from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src';
import { xeroNewBankTransaction } from '../src/lib/triggers/new-bank-transaction';
import { xeroNewContact } from '../src/lib/triggers/new-contact';
import { xeroNewProject } from '../src/lib/triggers/new-project';
import { xeroNewSalesInvoice } from '../src/lib/triggers/new-sales-invoice';
import { xeroUpdatedQuote } from '../src/lib/triggers/updated-quote';
import { webhookTiming, xeroTriggerState } from '../src/lib/common/trigger-state';
import { memoryStore, requestedHeaders, requestedUrl, runHook, stubFetch, stubFetchSequence } from './helpers';

const KEY = 'webhook-key';
const ORG = 'org-1';
const CONTACT_A = '11111111-1111-4111-8111-111111111111';
const CONTACT_B = '22222222-2222-4222-8222-222222222222';

const PRODUCTION_TIMING = { ...webhookTiming, fetchRetryDelaysMs: [...webhookTiming.fetchRetryDelaysMs] };

beforeEach(() => {
  webhookTiming.claimSettleMs = 0;
  webhookTiming.fetchRetryDelaysMs = [0, 0];
});

afterEach(() => {
  vi.unstubAllGlobals();
  Object.assign(webhookTiming, PRODUCTION_TIMING);
});

function signed({ body, key = KEY }: { body: unknown; key?: string }) {
  const rawBody = JSON.stringify(body);
  return { body, rawBody, headers: { 'x-xero-signature': createHmac('sha256', key).update(rawBody).digest('base64') }, queryParams: {} };
}

function event({ resourceId, eventType = 'CREATE', category = 'CONTACT', tenantId = ORG, date = '2026-10-05T10:00:00.000' }: { resourceId: string; eventType?: string; category?: string; tenantId?: string; date?: string }) {
  return {
    resourceUrl: `https://api.xero.com.evil.example/api.xro/2.0/Contacts/${resourceId}`,
    resourceId,
    eventDateUtc: date,
    eventType,
    eventCategory: category,
    tenantId,
    tenantType: 'ORGANISATION',
  };
}

describe('Xero webhook intent to receive', () => {
  it('declares the signature header as the handshake trigger', () => {
    expect(xeroNewContact.handshakeConfiguration).toEqual({ strategy: 'HEADER_PRESENT', paramName: 'x-xero-signature' });
  });

  it('answers 401 to a badly signed request', async () => {
    const payload = signed({ body: { events: [] }, key: 'wrong-key' });
    await expect(runHook({ trigger: xeroNewContact, hook: 'onHandshake', context: { payload, propsValue: { webhook_key: KEY } } })).resolves.toEqual({ status: 401 });
  });

  it('answers 401 when the raw body is missing', async () => {
    const payload = { ...signed({ body: { events: [] } }), rawBody: undefined };
    await expect(runHook({ trigger: xeroNewContact, hook: 'onHandshake', context: { payload, propsValue: { webhook_key: KEY } } })).resolves.toEqual({ status: 401 });
  });

  it('returns nothing for a correctly signed request so the delivery continues to run (and AP answers 200)', async () => {
    const payload = signed({ body: { events: [] } });
    await expect(runHook({ trigger: xeroNewContact, hook: 'onHandshake', context: { payload, propsValue: { webhook_key: KEY } } })).resolves.toBeUndefined();
  });
});

describe('Xero webhook deliveries', () => {
  it('fetches each event once from api.xero.com by resource ID, never from the event URL, and skips other organisations', async () => {
    const fetchMock = stubFetchSequence({
      responses: [
        { status: 200, body: { Contacts: [{ ContactID: CONTACT_A, Name: 'A' }] } },
        { status: 200, body: { Contacts: [{ ContactID: CONTACT_B, Name: 'B' }] } },
      ],
    });
    const { store } = memoryStore();
    const payload = signed({
      body: { events: [event({ resourceId: CONTACT_A }), event({ resourceId: CONTACT_A }), event({ resourceId: CONTACT_B }), event({ resourceId: CONTACT_B, tenantId: 'other-org' })] },
    });
    const result = await runHook({ trigger: xeroNewContact, hook: 'run', context: { payload, store, propsValue: { webhook_key: KEY, tenant_id: ORG, fetch_full_contact: true } } });
    expect(result).toEqual([{ ContactID: CONTACT_A, Name: 'A' }, { ContactID: CONTACT_B, Name: 'B' }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(requestedUrl({ fetchMock, call: 0 })).toBe(`https://api.xero.com/api.xro/2.0/Contacts/${CONTACT_A}`);
    expect(requestedHeaders({ fetchMock, call: 0 }).get('xero-tenant-id')).toBe(ORG);

    const replay = await runHook({ trigger: xeroNewContact, hook: 'run', context: { payload, store, propsValue: { webhook_key: KEY, tenant_id: ORG, fetch_full_contact: true } } });
    expect(replay).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('ignores deliveries with a bad signature', async () => {
    const fetchMock = stubFetch({ status: 200, body: {} });
    const { store } = memoryStore();
    const payload = { ...signed({ body: { events: [event({ resourceId: CONTACT_A })] } }), headers: { 'x-xero-signature': 'bad' } };
    await expect(runHook({ trigger: xeroNewContact, hook: 'run', context: { payload, store, propsValue: { webhook_key: KEY, tenant_id: ORG } } })).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('drops an event whose record was deleted (404) but fails on other errors without marking events as seen', async () => {
    const { store, data } = memoryStore();
    stubFetch({ status: 404, body: 'Not found' });
    const gone = signed({ body: { events: [event({ resourceId: CONTACT_A })] } });
    await expect(runHook({ trigger: xeroNewContact, hook: 'run', context: { payload: gone, store, propsValue: { webhook_key: KEY, tenant_id: ORG } } })).resolves.toEqual([]);

    const outage = stubFetch({ status: 503, body: { Message: 'Service unavailable' } });
    const failing = signed({ body: { events: [event({ resourceId: CONTACT_B })] } });
    await expect(runHook({ trigger: xeroNewContact, hook: 'run', context: { payload: failing, store, propsValue: { webhook_key: KEY, tenant_id: ORG } } })).rejects.toThrow('HTTP 503');
    expect(outage).toHaveBeenCalledTimes(3);
    expect(Object.keys(Object(data.get('xero_webhook_seen_events')))).toHaveLength(1);

    stubFetch({ status: 200, body: { Contacts: [{ ContactID: CONTACT_B }] } });
    await expect(runHook({ trigger: xeroNewContact, hook: 'run', context: { payload: failing, store, propsValue: { webhook_key: KEY, tenant_id: ORG } } })).resolves.toEqual([{ ContactID: CONTACT_B }]);
  });

  it('retries a passing Xero outage inside the run, because Xero already got its 200 and will not redeliver', async () => {
    const fetchMock = stubFetchSequence({
      responses: [
        { status: 503, body: { Message: 'Service unavailable' } },
        { status: 500, body: { Message: 'Oops' } },
        { status: 200, body: { Contacts: [{ ContactID: CONTACT_A }] } },
      ],
    });
    const { store } = memoryStore();
    const payload = signed({ body: { events: [event({ resourceId: CONTACT_A })] } });
    await expect(runHook({ trigger: xeroNewContact, hook: 'run', context: { payload, store, propsValue: { webhook_key: KEY, tenant_id: ORG } } })).resolves.toEqual([{ ContactID: CONTACT_A }]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry an error that a retry cannot fix', async () => {
    const fetchMock = stubFetch({ status: 403, body: { Detail: 'AuthorizationUnsuccessful' } });
    const { store, data } = memoryStore();
    const payload = signed({ body: { events: [event({ resourceId: CONTACT_A })] } });
    await expect(runHook({ trigger: xeroNewContact, hook: 'run', context: { payload, store, propsValue: { webhook_key: KEY, tenant_id: ORG } } })).rejects.toThrow('HTTP 403');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(Object.keys(Object(data.get('xero_webhook_seen_events')))).toHaveLength(0);
  });

  it('lets only one of two copies that pass the seen check at the same moment run the flow', async () => {
    webhookTiming.claimSettleMs = 5;
    const fetchMock = stubFetch({ status: 200, body: { Contacts: [{ ContactID: CONTACT_A }] } });
    const { store, data } = memoryStore();
    const payload = signed({ body: { events: [event({ resourceId: CONTACT_A })] } });
    const propsValue = { webhook_key: KEY, tenant_id: ORG, fetch_full_contact: true };
    const results = await Promise.all([
      runHook({ trigger: xeroNewContact, hook: 'run', context: { payload, store, propsValue } }),
      runHook({ trigger: xeroNewContact, hook: 'run', context: { payload, store, propsValue } }),
    ]);
    expect(results.filter((result) => Array.isArray(result) && result.length > 0)).toEqual([[{ ContactID: CONTACT_A }]]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect([...data.keys()].filter((key) => key.startsWith('xero_webhook_claim_'))).toEqual([]);
  });

  it('drops a repeated event for 48 hours however many other events arrive in between', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-05T10:00:00Z'));
    stubFetch({ status: 200, body: {} });
    const { store } = memoryStore();
    const propsValue = { webhook_key: KEY, tenant_id: ORG, fetch_full_contact: false };
    const first = signed({ body: { events: [event({ resourceId: CONTACT_A })] } });
    await expect(runHook({ trigger: xeroNewContact, hook: 'run', context: { payload: first, store, propsValue } })).resolves.toHaveLength(1);

    const others = Array.from({ length: 3000 }, (_, index) => event({ resourceId: `${index.toString(16).padStart(8, '0')}-0000-4000-8000-000000000000` }));
    await expect(runHook({ trigger: xeroNewContact, hook: 'run', context: { payload: signed({ body: { events: others } }), store, propsValue } })).resolves.toHaveLength(3000);

    vi.setSystemTime(new Date('2026-10-07T09:00:00Z'));
    await expect(runHook({ trigger: xeroNewContact, hook: 'run', context: { payload: first, store, propsValue } })).resolves.toEqual([]);
    vi.useRealTimers();
  });

  it('lets only one of two concurrent duplicate deliveries emit the event', async () => {
    let release: (() => void) | undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          release = () => resolve(new Response(JSON.stringify({ Contacts: [{ ContactID: CONTACT_A }] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { store } = memoryStore();
    const payload = signed({ body: { events: [event({ resourceId: CONTACT_A })] } });
    const propsValue = { webhook_key: KEY, tenant_id: ORG, fetch_full_contact: true };
    const firstRun = runHook({ trigger: xeroNewContact, hook: 'run', context: { payload, store, propsValue } });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await expect(runHook({ trigger: xeroNewContact, hook: 'run', context: { payload, store, propsValue } })).resolves.toEqual([]);
    release?.();
    await expect(firstRun).resolves.toEqual([{ ContactID: CONTACT_A }]);
  });

  it('keeps working for a 0.7.1 webhook trigger after the upgrade (no stored state, same props)', async () => {
    stubFetch({ status: 200, body: { Contacts: [{ ContactID: CONTACT_A }] } });
    const { store } = memoryStore({ initial: { xero_webhook_seen_events: ['unexpected-legacy-shape'] } });
    const payload = signed({ body: { events: [event({ resourceId: CONTACT_A })] } });
    const legacyProps = { webhookInstructions: undefined, tenant_id: ORG, webhook_key: KEY, fetch_full_contact: true };
    await expect(runHook({ trigger: xeroNewContact, hook: 'onHandshake', context: { payload, propsValue: legacyProps } })).resolves.toBeUndefined();
    await expect(runHook({ trigger: xeroNewContact, hook: 'run', context: { payload, store, propsValue: legacyProps } })).resolves.toEqual([{ ContactID: CONTACT_A }]);
  });

  it('ignores events whose resource ID is not a Xero GUID', async () => {
    const fetchMock = stubFetch({ status: 200, body: {} });
    const { store } = memoryStore();
    const payload = signed({ body: { events: [event({ resourceId: '../Organisation' })] } });
    await expect(runHook({ trigger: xeroNewContact, hook: 'run', context: { payload, store, propsValue: { webhook_key: KEY, tenant_id: ORG } } })).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns the raw events when fetching is off', async () => {
    const fetchMock = stubFetch({ status: 200, body: {} });
    const { store } = memoryStore();
    const payload = signed({ body: { events: [event({ resourceId: CONTACT_A })] } });
    const result = await runHook({ trigger: xeroNewContact, hook: 'run', context: { payload, store, propsValue: { webhook_key: KEY, tenant_id: ORG, fetch_full_contact: false } } });
    expect(result).toEqual([expect.objectContaining({ resourceId: CONTACT_A, eventType: 'CREATE' })]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('only emits sales invoices for the invoice triggers', async () => {
    stubFetchSequence({
      responses: [
        { status: 200, body: { Invoices: [{ InvoiceID: CONTACT_A, Type: 'ACCREC' }] } },
        { status: 200, body: { Invoices: [{ InvoiceID: CONTACT_B, Type: 'ACCPAY' }] } },
      ],
    });
    const { store } = memoryStore();
    const payload = signed({ body: { events: [event({ resourceId: CONTACT_A, category: 'INVOICE' }), event({ resourceId: CONTACT_B, category: 'INVOICE' })] } });
    const result = await runHook({ trigger: xeroNewSalesInvoice, hook: 'run', context: { payload, store, propsValue: { webhook_key: KEY, tenant_id: ORG, fetch_full_invoice: true } } });
    expect(result).toEqual([{ InvoiceID: CONTACT_A, Type: 'ACCREC' }]);
  });
});

describe('Polling state stays bounded', () => {
  it('keeps only the most recent 5,000 seen IDs and keeps the old store key', async () => {
    const previous = Array.from({ length: 5000 }, (_, index) => `old-${index}`);
    const { store, data } = memoryStore({ initial: { [`xero_bank_txn_seen_ids_${ORG}`]: previous } });
    stubFetch({
      status: 200,
      body: {
        BankTransactions: [
          { BankTransactionID: 'old-4999', UpdatedDateUTC: '/Date(1791216517000+0000)/' },
          { BankTransactionID: 'new-1', UpdatedDateUTC: '/Date(1791216518000+0000)/' },
          { BankTransactionID: 'new-2', UpdatedDateUTC: '/Date(1791216519000+0000)/' },
        ],
      },
    });
    data.set('lastPoll', 1);
    const result = await runHook({ trigger: xeroNewBankTransaction, hook: 'run', context: { store, propsValue: { tenant_id: ORG } } });
    expect(result).toEqual([
      { BankTransactionID: 'new-1', UpdatedDateUTC: '/Date(1791216518000+0000)/' },
      { BankTransactionID: 'new-2', UpdatedDateUTC: '/Date(1791216519000+0000)/' },
    ]);
    const stored = data.get(`xero_bank_txn_seen_ids_${ORG}`);
    expect(Array.isArray(stored) && stored.length).toBe(5000);
    expect(Array.isArray(stored) && stored.slice(-2)).toEqual(['new-1', 'new-2']);
    expect(Array.isArray(stored) && stored.includes('old-0')).toBe(false);
  });

  it('bounds per-ID maps to the most recent entries', () => {
    const map = Object.fromEntries(Array.from({ length: 5003 }, (_, index) => [`q-${index}`, index]));
    const bounded = xeroTriggerState.boundMap({ map });
    expect(Object.keys(bounded)).toHaveLength(5000);
    expect(bounded['q-0']).toBeUndefined();
    expect(bounded['q-5002']).toBe(5002);
  });

  it('Updated Quote fires again only when the quote changes', async () => {
    const { store, data } = memoryStore({ initial: { lastPoll: 1 } });
    const quote = { QuoteID: 'q1', UpdatedDateUTC: '/Date(1791216518000+0000)/' };
    stubFetch({ status: 200, body: { Quotes: [quote] } });
    await expect(runHook({ trigger: xeroUpdatedQuote, hook: 'run', context: { store, propsValue: { tenant_id: ORG } } })).resolves.toEqual([quote]);
    data.set('lastPoll', 1);
    await expect(runHook({ trigger: xeroUpdatedQuote, hook: 'run', context: { store, propsValue: { tenant_id: ORG } } })).resolves.toEqual([]);
  });
});

describe('Polling cursor', () => {
  const at = ({ seconds }: { seconds: number }) => `/Date(${1791216500000 + seconds * 1000}+0000)/`;

  it('leaves the newest instant for the next poll when the page cap cuts the scan short', async () => {
    const page = ({ id, seconds }: { id: string; seconds: number }) => ({ status: 200, body: { BankTransactions: [{ BankTransactionID: id, UpdatedDateUTC: at({ seconds }) }] } });
    stubFetchSequence({ responses: [page({ id: 'r1', seconds: 1 }), page({ id: 'r2', seconds: 2 }), page({ id: 'r3', seconds: 3 }), page({ id: 'r4', seconds: 4 }), page({ id: 'r5', seconds: 4 })] });
    const { store, data } = memoryStore({ initial: { lastPoll: 1 } });
    const first = await runHook({ trigger: xeroNewBankTransaction, hook: 'run', context: { store, propsValue: { tenant_id: ORG, page_size: 1 } } });
    expect(first).toEqual([expect.objectContaining({ BankTransactionID: 'r1' }), expect.objectContaining({ BankTransactionID: 'r2' }), expect.objectContaining({ BankTransactionID: 'r3' })]);
    expect(data.get('lastPoll')).toBe(1791216503000);

    stubFetch({ status: 200, body: { BankTransactions: [{ BankTransactionID: 'r4', UpdatedDateUTC: at({ seconds: 4 }) }, { BankTransactionID: 'r5', UpdatedDateUTC: at({ seconds: 4 }) }, { BankTransactionID: 'r6', UpdatedDateUTC: at({ seconds: 4 }) }] } });
    const second = await runHook({ trigger: xeroNewBankTransaction, hook: 'run', context: { store, propsValue: { tenant_id: ORG, page_size: 5 } } });
    expect(Array.isArray(second) && second.map((record) => Reflect.get(Object(record), 'BankTransactionID'))).toEqual(['r4', 'r5', 'r6']);
  });

  it('keeps reading past the page cap while every record shares one instant, so none are skipped', async () => {
    const same = ({ id }: { id: string }) => ({ status: 200, body: { BankTransactions: [{ BankTransactionID: id, UpdatedDateUTC: at({ seconds: 4 }) }] } });
    const fetchMock = stubFetchSequence({
      responses: [
        same({ id: 's1' }),
        same({ id: 's2' }),
        same({ id: 's3' }),
        same({ id: 's4' }),
        same({ id: 's5' }),
        same({ id: 's6' }),
        { status: 200, body: { BankTransactions: [{ BankTransactionID: 'n1', UpdatedDateUTC: at({ seconds: 5 }) }] } },
      ],
    });
    const { store, data } = memoryStore({ initial: { lastPoll: 1 } });
    const result = await runHook({ trigger: xeroNewBankTransaction, hook: 'run', context: { store, propsValue: { tenant_id: ORG, page_size: 1 } } });
    expect(Array.isArray(result) && result.map((record) => Reflect.get(Object(record), 'BankTransactionID'))).toEqual(['s1', 's2', 's3', 's4', 's5', 's6']);
    expect(fetchMock).toHaveBeenCalledTimes(7);
    expect(data.get('lastPoll')).toBe(1791216504000);
  });

  it('fails instead of skipping when too many records share one instant to read', async () => {
    const fetchMock = stubFetch({ status: 200, body: { BankTransactions: [{ BankTransactionID: 'same', UpdatedDateUTC: at({ seconds: 4 }) }] } });
    const { store, data } = memoryStore({ initial: { lastPoll: 1 } });
    await expect(runHook({ trigger: xeroNewBankTransaction, hook: 'run', context: { store, propsValue: { tenant_id: ORG, page_size: 1 } } })).rejects.toThrow('share the same UpdatedDateUTC');
    expect(fetchMock).toHaveBeenCalledTimes(50);
    expect(data.get('lastPoll')).toBe(1);
  });

  it('moves past records that a filter rejects, so they cannot pin the cursor', async () => {
    const account = '33333333-3333-4333-8333-333333333333';
    stubFetch({ status: 200, body: { BankTransactions: [{ BankTransactionID: 'other', BankAccount: { AccountID: 'not-it' }, UpdatedDateUTC: at({ seconds: 9 }) }] } });
    const { store, data } = memoryStore({ initial: { lastPoll: 1 } });
    await expect(runHook({ trigger: xeroNewBankTransaction, hook: 'run', context: { store, propsValue: { tenant_id: ORG, bank_account_id: account } } })).resolves.toEqual([]);
    expect(data.get('lastPoll')).toBe(1791216509000);
  });

  it('keeps an ID that is still being seen even when the set is full', async () => {
    const previous = ['kept', ...Array.from({ length: 4999 }, (_, index) => `old-${index}`)];
    const { store, data } = memoryStore({ initial: { [`xero_bank_txn_seen_ids_${ORG}`]: previous, lastPoll: 1 } });
    stubFetch({ status: 200, body: { BankTransactions: [{ BankTransactionID: 'kept', UpdatedDateUTC: at({ seconds: 1 }) }, { BankTransactionID: 'new-1', UpdatedDateUTC: at({ seconds: 2 }) }] } });
    await expect(runHook({ trigger: xeroNewBankTransaction, hook: 'run', context: { store, propsValue: { tenant_id: ORG } } })).resolves.toEqual([
      { BankTransactionID: 'new-1', UpdatedDateUTC: at({ seconds: 2 }) },
    ]);
    const stored = data.get(`xero_bank_txn_seen_ids_${ORG}`);
    expect(Array.isArray(stored) && stored.includes('kept')).toBe(true);
    expect(Array.isArray(stored) && stored.includes('old-0')).toBe(false);
  });
});

describe('Republishing a polling trigger', () => {
  it('keeps the cursor when the inputs are unchanged and starts fresh when they change', async () => {
    const { store, data } = memoryStore();
    await runHook({ trigger: xeroNewBankTransaction, hook: 'onEnable', context: { store, propsValue: { tenant_id: ORG }, isRepublish: false } });
    data.set('lastPoll', 123);
    await runHook({ trigger: xeroNewBankTransaction, hook: 'onEnable', context: { store, propsValue: { tenant_id: ORG }, isRepublish: true } });
    expect(data.get('lastPoll')).toBe(123);
    await runHook({ trigger: xeroNewBankTransaction, hook: 'onEnable', context: { store, propsValue: { tenant_id: ORG, statuses: ['DELETED'] }, isRepublish: true } });
    expect(data.get('lastPoll')).not.toBe(123);
  });

  it('keeps the cursor when only Page Size changes, so raising it can read past a crowded timestamp', async () => {
    const { store, data } = memoryStore();
    await runHook({ trigger: xeroNewBankTransaction, hook: 'onEnable', context: { store, propsValue: { tenant_id: ORG, page_size: 200 }, isRepublish: false } });
    data.set('lastPoll', 123);
    await runHook({ trigger: xeroNewBankTransaction, hook: 'onEnable', context: { store, propsValue: { tenant_id: ORG, page_size: 1000 }, isRepublish: true } });
    expect(data.get('lastPoll')).toBe(123);
  });

  it('keeps state written by 0.7.1, which has no input fingerprint', async () => {
    const { store, data } = memoryStore({ initial: { lastPoll: 123, [`xero_bank_txn_seen_ids_${ORG}`]: ['b1'] } });
    await runHook({ trigger: xeroNewBankTransaction, hook: 'onEnable', context: { store, propsValue: { tenant_id: ORG }, isRepublish: true } });
    expect(data.get('lastPoll')).toBe(123);
    expect(data.get(`xero_bank_txn_seen_ids_${ORG}`)).toEqual(['b1']);
  });

  it('re-seeds New Project when its filters change, so existing projects do not fire', async () => {
    const { store, data } = memoryStore();
    stubFetch({ status: 200, body: { items: [{ projectId: 'p-open', name: 'Open' }] } });
    await runHook({ trigger: xeroNewProject, hook: 'onEnable', context: { store, propsValue: { tenant_id: ORG, states: ['INPROGRESS'] }, isRepublish: false } });
    stubFetch({ status: 200, body: { items: [{ projectId: 'p-open', name: 'Open' }, { projectId: 'p-closed', name: 'Closed' }] } });
    await runHook({ trigger: xeroNewProject, hook: 'onEnable', context: { store, propsValue: { tenant_id: ORG, states: ['INPROGRESS', 'CLOSED'] }, isRepublish: true } });
    data.set('lastPoll', 1);
    await expect(runHook({ trigger: xeroNewProject, hook: 'run', context: { store, propsValue: { tenant_id: ORG, states: ['INPROGRESS', 'CLOSED'] } } })).resolves.toEqual([]);
  });
});

describe('Trigger test step', () => {
  it('loads only the 5 most recently updated records in one request', async () => {
    const fetchMock = stubFetch({ status: 200, body: { BankTransactions: Array.from({ length: 8 }, (_, index) => ({ BankTransactionID: `b${index}` })) } });
    const { store } = memoryStore();
    const result = await runHook({ trigger: xeroNewBankTransaction, hook: 'test', context: { store, propsValue: { tenant_id: ORG } } });
    expect(Array.isArray(result) && result.length).toBe(5);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(requestedUrl({ fetchMock }));
    expect(url.searchParams.get('order')).toBe('UpdatedDateUTC DESC');
    expect(url.searchParams.get('pageSize')).toBe('5');
  });
});

describe('New Project first poll', () => {
  it('does not fire for projects that existed when the trigger was enabled', async () => {
    const { store, data } = memoryStore();
    const existing = { items: [{ projectId: 'p-old-1', name: 'Old 1' }, { projectId: 'p-old-2', name: 'Old 2' }] };
    stubFetch({ status: 200, body: existing });
    await runHook({ trigger: xeroNewProject, hook: 'onEnable', context: { store, propsValue: { tenant_id: ORG } } });
    await expect(runHook({ trigger: xeroNewProject, hook: 'run', context: { store, propsValue: { tenant_id: ORG } } })).resolves.toEqual([]);

    data.set('lastPoll', 1);
    stubFetch({ status: 200, body: { items: [...existing.items, { projectId: 'p-new', name: 'New' }] } });
    await expect(runHook({ trigger: xeroNewProject, hook: 'run', context: { store, propsValue: { tenant_id: ORG } } })).resolves.toEqual([{ projectId: 'p-new', name: 'New' }]);
  });
});
