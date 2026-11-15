import { Store } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { newCase as newCaseTrigger } from '../../src/lib/triggers/new-case';
import { updatedCase as updatedCaseTrigger } from '../../src/lib/triggers/updated-case';
import { FAKE_SPRINKLR_CLIENT, FakeSprinklr, startFakeSprinklr } from '../support/fake-sprinklr';
import { pieceRunner, RunnablePollingTrigger, shape } from '../support/piece-runner';

const T0 = 1_780_000_000_000;
const MINUTE = 60_000;

const newCase = pieceRunner.pollingTrigger(newCaseTrigger);
const updatedCase = pieceRunner.pollingTrigger(updatedCaseTrigger);
let fake: FakeSprinklr | undefined;
let clock = T0;

afterEach(async () => {
  await fake?.close();
  fake = undefined;
  vi.useRealTimers();
});

function tick(ms: number): void {
  clock += ms;
  vi.setSystemTime(clock);
}

async function start(envelope: 'wrapped' | 'bare'): Promise<{ f: FakeSprinklr; auth: Auth }> {
  clock = T0;
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(clock);
  const f = await startFakeSprinklr({ envelope, now: () => clock });
  fake = f;
  const token = f.control.issueToken();
  return {
    f,
    auth: { access_token: token.accessToken, client_id: FAKE_SPRINKLR_CLIENT.apiKey, props: { base: f.baseUrl, callback: FAKE_SPRINKLR_CLIENT.redirectUris[0] } },
  };
}

function memoryStore(): Store {
  const data = new Map<string, string>();
  return {
    put: async <T>(key: string, value: T): Promise<T> => {
      data.set(key, JSON.stringify(value));
      return value;
    },
    get: async <T>(key: string): Promise<T | null> => {
      const raw = data.get(key);
      return raw === undefined ? null : JSON.parse(raw);
    },
    delete: async (key: string): Promise<void> => {
      data.delete(key);
    },
  };
}

function contextFor({ auth, store, queueId }: { auth: Auth; store: Store; queueId?: string }) {
  return pieceRunner.pollingContext({ auth, store, propsValue: { queueId } });
}

async function enabled({ trigger, auth, queueId }: { trigger: RunnablePollingTrigger; auth: Auth; queueId?: string }) {
  const store = memoryStore();
  const context = contextFor({ auth, store, queueId });
  await trigger.onEnable(context);
  return { poll: () => trigger.run(context) };
}

async function callApi({ f, auth, method, path, body }: { f: FakeSprinklr; auth: Auth; method: string; path: string; body?: unknown }): Promise<number> {
  const res = await fetch(`${f.baseUrl}/api/v3${path}`, {
    method,
    headers: { Authorization: `Bearer ${auth.access_token}`, Key: auth.client_id, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return res.status;
}

async function createCase({ f, auth, subject, queueId }: { f: FakeSprinklr; auth: Auth; subject: string; queueId?: number }): Promise<number> {
  const status = await callApi({
    f,
    auth,
    method: 'POST',
    path: '/case',
    body: {
      subject,
      channelType: 'EMAIL',
      contactInfo: { email: 'new.customer@example.com', fullName: 'New Customer' },
      ...(queueId === undefined ? {} : { workflow: { queues: [{ queueId }] } }),
    },
  });
  expect(status).toBe(201);
  return f.state.cases[f.state.cases.length - 1].caseNumber;
}

function caseNumbers(items: unknown[]): unknown[] {
  return items.map((item) => (shape.isRecord(item) ? item['caseNumber'] : undefined));
}

function searchRequests(f: FakeSprinklr): Array<{ method: string; path: string }> {
  return f.state.requests.filter((r) => r.path.startsWith('/api/v3/search/case')).map((r) => ({ method: r.method, path: r.path }));
}

describe.each(['wrapped', 'bare'] as const)('case triggers against the fake Sprinklr (%s envelope)', (envelope) => {
  it('does not flood the flow with cases that existed before it was turned on', async () => {
    const { f, auth } = await start(envelope);
    f.control.seedCases(10);
    const trigger = await enabled({ trigger: newCase, auth });
    tick(MINUTE);

    expect(await trigger.poll()).toEqual([]);
    expect(searchRequests(f)).toEqual([{ method: 'POST', path: '/api/v3/search/case' }]);
  });

  it('fires once, and only once, for a case created after it was turned on', async () => {
    const { f, auth } = await start(envelope);
    f.control.seedCases(3);
    const trigger = await enabled({ trigger: newCase, auth });
    tick(MINUTE);
    const created = await createCase({ f, auth, subject: 'Late parcel' });
    tick(MINUTE);

    const first = await trigger.poll();
    tick(5 * MINUTE);
    const second = await trigger.poll();

    expect(caseNumbers(first)).toEqual([created]);
    expect(first[0]).toMatchObject({ subject: `#${created} Email Late parcel`, createdTime: T0 + MINUTE });
    expect(second).toEqual([]);
  });

  it('dedupes on time: each new case fires in the poll after it was created', async () => {
    const { f, auth } = await start(envelope);
    const trigger = await enabled({ trigger: newCase, auth });
    tick(MINUTE);
    const a = await createCase({ f, auth, subject: 'A' });
    const b = await createCase({ f, auth, subject: 'B' });
    const first = await trigger.poll();
    tick(MINUTE);
    const c = await createCase({ f, auth, subject: 'C' });
    const second = await trigger.poll();

    expect(caseNumbers(first)).toEqual([a, b]);
    expect(caseNumbers(second)).toEqual([c]);
  });

  it('fires Updated Case again when a case changes, and not New Case', async () => {
    const { f, auth } = await start(envelope);
    const [seeded] = f.control.seedCases(3);
    const created = await enabled({ trigger: newCase, auth });
    const updated = await enabled({ trigger: updatedCase, auth });
    tick(MINUTE);

    expect(await callApi({ f, auth, method: 'PATCH', path: `/case?caseNumber=${seeded.caseNumber}`, body: { priority: 'High' } })).toBe(204);
    const updatedFirst = await updated.poll();
    const createdFirst = await created.poll();
    tick(MINUTE);
    expect(await callApi({ f, auth, method: 'PATCH', path: `/case?caseNumber=${seeded.caseNumber}`, body: { status: 'Closed' } })).toBe(204);
    const updatedSecond = await updated.poll();
    const updatedThird = await updated.poll();

    expect(caseNumbers(updatedFirst)).toEqual([seeded.caseNumber]);
    expect(updatedFirst[0]).toMatchObject({ priority: 'High', modifiedTime: T0 + MINUTE });
    expect(createdFirst).toEqual([]);
    expect(caseNumbers(updatedSecond)).toEqual([seeded.caseNumber]);
    expect(updatedSecond[0]).toMatchObject({ status: 'Closed', modifiedTime: T0 + 2 * MINUTE });
    expect(updatedThird).toEqual([]);
  });

  it('fires both triggers for a new case', async () => {
    const { f, auth } = await start(envelope);
    const created = await enabled({ trigger: newCase, auth });
    const updated = await enabled({ trigger: updatedCase, auth });
    tick(MINUTE);
    const number = await createCase({ f, auth, subject: 'Both' });

    expect(caseNumbers(await created.poll())).toEqual([number]);
    expect(caseNumbers(await updated.poll())).toEqual([number]);
  });

  it('returns at most the five newest cases when testing', async () => {
    const { f, auth } = await start(envelope);
    const seeded = f.control.seedCases(10);

    const items = await newCase.test(contextFor({ auth, store: memoryStore() }));

    expect(caseNumbers(items)).toEqual(seeded.slice(5).reverse().map((c) => c.caseNumber));
  });

  it('pages through more than one page of new cases in one poll', async () => {
    const { f, auth } = await start(envelope);
    const trigger = await enabled({ trigger: newCase, auth });
    tick(10 * MINUTE);
    const seeded = f.control.seedCases(130, (i) => ({ createdTime: T0 + 1000 + i * 10, modifiedTime: T0 + 1000 + i * 10 }));
    f.state.requests.length = 0;

    const first = await trigger.poll();
    const second = await trigger.poll();

    expect(caseNumbers(first)).toEqual(seeded.map((c) => c.caseNumber));
    expect(second).toEqual([]);
    const requests = searchRequests(f);
    expect(requests.map((r) => r.method)).toEqual(['POST', 'GET', 'POST']);
  });

  it('only fires for the chosen queue', async () => {
    const { f, auth } = await start(envelope);
    const trigger = await enabled({ trigger: newCase, auth, queueId: '5001' });
    tick(MINUTE);
    await createCase({ f, auth, subject: 'Other queue', queueId: 7002 });
    const inQueue = await createCase({ f, auth, subject: 'Right queue', queueId: 5001 });
    await createCase({ f, auth, subject: 'No queue' });

    expect(caseNumbers(await trigger.poll())).toEqual([inQueue]);
  });
});

type Auth = { access_token: string; client_id: string; props: Record<string, unknown> };
