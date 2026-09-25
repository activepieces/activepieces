import { HttpError, type HttpRequest } from '@activepieces/pieces-common';
import { setAconexClockForTests } from '../src/lib/client';
import { ACONEX_CURSOR_KEY, type AconexCursor, ensureCursor, loadPollingItems } from '../src/lib/triggers/polling';
import { newOrUpdatedMailTrigger } from '../src/lib/triggers/new-or-updated-mail';
import { authServer, connection, memoryStore, mockHttp, prepareAconexTest, productionAuth } from './helpers';

const HOUR = '2026-09-25T04:00:00.000Z';

function mailXml(rows: Array<{ id: string; lastModifiedDate: string }>): string {
  const body = rows
    .map((row) => `<Mail><id>${row.id}</id><lastModifiedDate>${row.lastModifiedDate}</lastModifiedDate></Mail>`)
    .join('');
  return `<IntegrityCheckResults>${body}</IntegrityCheckResults>`;
}

function minute(index: number): string {
  return `2026-09-25T04:${String(index).padStart(2, '0')}:00.000Z`;
}

describe('polling cursor', () => {
  beforeEach(() => {
    prepareAconexTest();
    setAconexClockForTests(() => Date.parse('2026-09-25T06:30:00.000Z'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('items returns the oldest 25 unseen rows and does not advance the hour', async () => {
    const rows = Array.from({ length: 30 }, (_, index) => ({
      id: String(1001 + index),
      lastModifiedDate: minute(index + 1),
    }));
    const store = memoryStore({
      [ACONEX_CURSOR_KEY]: { sinceHour: HOUR, baselineEpoch: Date.parse('2026-09-25T03:00:00.000Z'), seen: [] },
    });
    const spy = mockHttp(async (request) => {
      if (String(request.url).includes('/integrity')) {
        return { status: 200, headers: {}, body: mailXml(rows) };
      }
      const id = String(request.url).split('/').pop();
      return { status: 200, headers: {}, body: `<Mail MailId="${id}"><MailData>x</MailData></Mail>` };
    });

    const page = await loadPollingItems({
      kind: 'mail',
      auth: productionAuth,
      store,
      propsValue: { projectId: '1879048400', mailBox: 'inbox' },
      lastFetchEpochMS: Date.parse('2026-09-25T03:30:00.000Z'),
    });

    expect(page).toHaveLength(25);
    expect((page[0].data as { Mail: { '@MailId': string } }).Mail['@MailId']).toBe('1001');
    expect((page[24].data as { Mail: { '@MailId': string } }).Mail['@MailId']).toBe('1025');
    const cursor = await store.get<AconexCursor>(ACONEX_CURSOR_KEY);
    expect(cursor?.sinceHour).toBe(HOUR);
    expect(cursor?.seen).toHaveLength(25);
    expect(cursor?.seen).not.toContain('1030:' + minute(30));
    const integrity = spy.mock.calls.map((call) => call[0]).find((request) => String(request.url).includes('/integrity')) as HttpRequest;
    expect(integrity.queryParams?.['everythingsince']).toBe(HOUR);
    expect(integrity.queryParams?.['mail_box']).toBe('INBOX');
    expect(integrity.queryParams).not.toHaveProperty('username');
    expect(integrity.queryParams).not.toHaveProperty('password');
    expect(String(integrity.url)).not.toMatch(/username|password/i);
    expect(integrity.headers?.['Accept']).toBe('application/vnd.aconex.mail.v2+xml');
  });

  test('advances the hour only after every row in that hour is seen', async () => {
    const rows = [1, 2].map((index) => ({ id: String(1000 + index), lastModifiedDate: minute(index) }));
    const store = memoryStore({
      [ACONEX_CURSOR_KEY]: { sinceHour: HOUR, baselineEpoch: Date.parse('2026-09-25T03:00:00.000Z'), seen: [] },
    });
    mockHttp(async (request) => {
      if (String(request.url).includes('/integrity')) {
        return { status: 200, headers: {}, body: mailXml(rows) };
      }
      const id = String(request.url).split('/').pop();
      return { status: 200, headers: {}, body: `<Mail MailId="${id}"><MailData>x</MailData></Mail>` };
    });
    await loadPollingItems({
      kind: 'mail',
      auth: productionAuth,
      store,
      propsValue: { projectId: '1879048400', mailBox: 'inbox' },
      lastFetchEpochMS: Date.parse('2026-09-25T03:30:00.000Z'),
    });
    const cursor = await store.get<AconexCursor>(ACONEX_CURSOR_KEY);
    expect(cursor?.sinceHour).toBe('2026-09-25T06:00:00.000Z');
    expect(cursor?.seen).toHaveLength(2);
  });

  test('document dedupe key includes lastEventDate', async () => {
    const xml = [
      '<IntegrityCheckResults>',
      '<Document><DocumentId>1879093137</DocumentId><lastModifiedDate>2026-09-25T04:10:00.000Z</lastModifiedDate><lastEventDate>2026-09-25T04:10:00.000Z</lastEventDate></Document>',
      '<Document><DocumentId>1879093137</DocumentId><lastModifiedDate>2026-09-25T04:10:00.000Z</lastModifiedDate><lastEventDate>2026-09-25T04:20:00.000Z</lastEventDate></Document>',
      '</IntegrityCheckResults>',
    ].join('');
    const oldKey = '1879093137:2026-09-25T04:10:00.000Z:2026-09-25T04:10:00.000Z';
    const newKey = '1879093137:2026-09-25T04:10:00.000Z:2026-09-25T04:20:00.000Z';
    const store = memoryStore({
      [ACONEX_CURSOR_KEY]: { sinceHour: HOUR, baselineEpoch: Date.parse('2026-09-25T03:00:00.000Z'), seen: [oldKey] },
    });
    const spy = mockHttp(async (request) => {
      if (String(request.url).includes('/integrity')) {
        return { status: 200, headers: {}, body: xml };
      }
      return { status: 200, headers: {}, body: '<Document DocumentId="1879093137"><Author>Ada Lovelace</Author></Document>' };
    });
    const page = await loadPollingItems({
      kind: 'document',
      auth: productionAuth,
      store,
      propsValue: { projectId: '1879048400' },
      lastFetchEpochMS: Date.parse('2026-09-25T03:30:00.000Z'),
    });
    expect(page).toHaveLength(1);
    const cursor = await store.get<AconexCursor>(ACONEX_CURSOR_KEY);
    expect(cursor?.seen).toContain(oldKey);
    expect(cursor?.seen).toContain(newKey);
    const metadata = spy.mock.calls.map((call) => call[0]).find((request) => String(request.url).includes('/metadata')) as HttpRequest;
    expect(metadata.queryParams?.['sanitizeInvalidXmlCharacters']).toBe('true');
    const integrity = spy.mock.calls.map((call) => call[0]).find((request) => String(request.url).includes('/integrity')) as HttpRequest;
    expect(integrity.queryParams?.['show_document_history']).toBe('true');
    expect(integrity.queryParams).not.toHaveProperty('password');
  });

  test('a body over 20 MB does not move the hour', async () => {
    const store = memoryStore({
      [ACONEX_CURSOR_KEY]: { sinceHour: HOUR, baselineEpoch: 1, seen: ['keep'] },
    });
    mockHttp(async () => ({ status: 200, headers: {}, body: 'x'.repeat(20 * 1024 * 1024 + 1) }));
    await expect(loadPollingItems({
      kind: 'mail',
      auth: productionAuth,
      store,
      propsValue: { projectId: '1879048400', mailBox: 'inbox' },
      lastFetchEpochMS: 1,
    })).rejects.toMatchObject({ code: 'RESPONSE_TOO_LARGE' });
    expect(await store.get(ACONEX_CURSOR_KEY)).toEqual({ sinceHour: HOUR, baselineEpoch: 1, seen: ['keep'] });
  });

  test('does not drop keys or move the hour when the seen set is full', async () => {
    const seen = Array.from({ length: 5000 }, (_, index) => `old:${index}`);
    const store = memoryStore({
      [ACONEX_CURSOR_KEY]: { sinceHour: HOUR, baselineEpoch: Date.parse('2026-09-25T03:00:00.000Z'), seen },
    });
    mockHttp(async () => ({
      status: 200,
      headers: {},
      body: mailXml([{ id: '1001', lastModifiedDate: minute(1) }]),
    }));
    await expect(loadPollingItems({
      kind: 'mail',
      auth: productionAuth,
      store,
      propsValue: { projectId: '1879048400', mailBox: 'inbox' },
      lastFetchEpochMS: Date.parse('2026-09-25T03:30:00.000Z'),
    })).rejects.toMatchObject({ code: 'SEEN_SET_FULL' });
    const cursor = await store.get<AconexCursor>(ACONEX_CURSOR_KEY);
    expect(cursor?.sinceHour).toBe(HOUR);
    expect(cursor?.seen).toHaveLength(5000);
  });

  test('onEnable keeps lastPoll when republishing and onDisable keeps the cursor', async () => {
    const store = memoryStore({ lastPoll: 123, [ACONEX_CURSOR_KEY]: { sinceHour: HOUR, baselineEpoch: 5, seen: ['a'] } });
    const context = {
      store,
      auth: connection(),
      propsValue: { projectId: '1879048400', mailBox: 'inbox' },
      server: authServer,
      isRepublish: true,
    };
    await newOrUpdatedMailTrigger.onEnable(context as never);
    expect(await store.get('lastPoll')).toBe(123);
    expect(await store.get(ACONEX_CURSOR_KEY)).toEqual({ sinceHour: HOUR, baselineEpoch: 5, seen: ['a'] });
    await newOrUpdatedMailTrigger.onDisable(context as never);
    expect(await store.get('lastPoll')).toBe(123);
    expect(await store.get(ACONEX_CURSOR_KEY)).toEqual({ sinceHour: HOUR, baselineEpoch: 5, seen: ['a'] });
  });

  test('ensureCursor writes the current UTC hour only when the cursor is absent', async () => {
    const store = memoryStore();
    await ensureCursor(store);
    expect(await store.get(ACONEX_CURSOR_KEY)).toEqual({
      sinceHour: '2026-09-25T06:00:00.000Z',
      baselineEpoch: Date.parse('2026-09-25T06:30:00.000Z'),
      seen: [],
    });
    await ensureCursor(store);
    expect((await store.get<AconexCursor>(ACONEX_CURSOR_KEY))?.seen).toEqual([]);
  });

  test('test polling does not call integrity', async () => {
    const store = memoryStore();
    const spy = mockHttp(async () => ({
      status: 200,
      headers: {},
      body: '<MailSearch TotalResults="1"><SearchResults><Mail MailId="1879053088"><Confidential>true</Confidential></Mail></SearchResults></MailSearch>',
    }));
    const page = await loadPollingItems({
      kind: 'mail',
      auth: productionAuth,
      store,
      propsValue: { projectId: '1879048400', mailBox: 'inbox' },
      lastFetchEpochMS: 0,
    });
    expect(page.length).toBeLessThanOrEqual(5);
    expect(spy.mock.calls.some((call) => String(call[0].url).includes('/integrity'))).toBe(false);
    expect(await store.get(ACONEX_CURSOR_KEY)).toBeNull();
  });

  test('a failed hydration is returned and marked seen', async () => {
    const store = memoryStore({
      [ACONEX_CURSOR_KEY]: { sinceHour: HOUR, baselineEpoch: Date.parse('2026-09-25T03:00:00.000Z'), seen: [] },
    });
    mockHttp(async (request) => {
      if (String(request.url).includes('/integrity')) {
        return { status: 200, headers: {}, body: mailXml([{ id: '1001', lastModifiedDate: minute(1) }]) };
      }
      throw new HttpError({}, { status: 400, responseBody: '<Error><ErrorCode>USER_NOT_ON_PROJECT</ErrorCode><RequestID>abc123</RequestID></Error>' });
    });
    const page = await loadPollingItems({
      kind: 'mail',
      auth: productionAuth,
      store,
      propsValue: { projectId: '1879048400', mailBox: 'inbox' },
      lastFetchEpochMS: Date.parse('2026-09-25T03:30:00.000Z'),
    });
    expect(page[0].data).toMatchObject({ id: '1001', hydration: 'failed', errorCode: 'USER_NOT_ON_PROJECT' });
    const cursor = await store.get<AconexCursor>(ACONEX_CURSOR_KEY);
    expect(cursor?.seen).toContain(`1001:${minute(1)}`);
  });
});
