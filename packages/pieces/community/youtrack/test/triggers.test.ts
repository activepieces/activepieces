import { HttpError } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { newIssueTrigger } from '../src/lib/triggers/new-issue';
import { updatedIssueTrigger } from '../src/lib/triggers/updated-issue';
import { formatYoutrackDateTimeLiteral } from '../src/lib/common';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

const AUTH = { type: AppConnectionType.CUSTOM_AUTH, props: { baseUrl: 'https://x.youtrack.cloud', apiToken: 'perm:x' } };
const CHECKPOINT = Date.UTC(2026, 10, 5, 10, 0, 0);

function memoryStore({ lastPoll }: { lastPoll?: number }) {
  const data = new Map<string, unknown>();
  if (lastPoll !== undefined) data.set('lastPoll', lastPoll);
  return {
    data,
    store: {
      get: async (key: string): Promise<unknown> => data.get(key) ?? null,
      put: async (key: string, value: unknown): Promise<unknown> => {
        data.set(key, value);
        return value;
      },
      delete: async (key: string): Promise<void> => {
        data.delete(key);
      },
    },
  };
}

function context({ store }: { store: ReturnType<typeof memoryStore>['store'] }) {
  return { auth: AUTH, propsValue: {}, store, files: {}, server: { apiUrl: '', publicUrl: '', token: '' } };
}

function ok(body: unknown) {
  sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body });
}

function issue({ id, created, updated }: { id: string; created: number; updated?: number }) {
  return { id, idReadable: id, created, updated: updated ?? created, customFields: [] };
}

function run({ trigger, ctx }: { trigger: { run: (ctx: never) => Promise<unknown> }; ctx: unknown }): Promise<unknown> {
  return Reflect.apply(trigger.run, undefined, [ctx]);
}

beforeEach(() => {
  sendRequest.mockReset();
});

describe('new_issue', () => {
  it('queries ascending from the checkpoint in the user time zone and emits only newer issues', async () => {
    const { store, data } = memoryStore({ lastPoll: CHECKPOINT });
    ok({ profiles: { general: { timezone: { id: 'America/New_York' } } } });
    ok([issue({ id: 'A', created: CHECKPOINT }), issue({ id: 'B', created: CHECKPOINT + 5000 })]);
    const out = await run({ trigger: newIssueTrigger, ctx: context({ store }) });
    expect(sendRequest.mock.calls[1][0].queryParams).toMatchObject({
      query: 'created: 2026-11-05T05:00:00 .. * sort by: created asc',
      $top: '50',
      $skip: '0',
    });
    expect(out).toEqual([expect.objectContaining({ id: 'B' })]);
    expect(data.get('lastPoll')).toBe(CHECKPOINT + 5000);
    expect(sendRequest.mock.calls[1][1].dispatcher.constructor.name).toBe('Agent');
  });

  it('rethrows a time zone lookup failure instead of polling in UTC, and keeps the checkpoint', async () => {
    const { store, data } = memoryStore({ lastPoll: CHECKPOINT });
    sendRequest.mockRejectedValueOnce(new HttpError({}, { status: 403, responseBody: { error_description: 'No access' } }));
    await expect(run({ trigger: newIssueTrigger, ctx: context({ store }) })).rejects.toThrow('No access');
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(data.get('lastPoll')).toBe(CHECKPOINT);
  });

  it('a failure on a later page leaves the checkpoint untouched', async () => {
    const { store, data } = memoryStore({ lastPoll: CHECKPOINT });
    ok({ profiles: { general: { timezone: { id: 'UTC' } } } });
    ok(Array.from({ length: 50 }, (_, i) => issue({ id: `I${i}`, created: CHECKPOINT + 1 + i })));
    sendRequest.mockRejectedValueOnce(new HttpError({}, { status: 500, responseBody: 'boom' }));
    await expect(run({ trigger: newIssueTrigger, ctx: context({ store }) })).rejects.toThrow('HTTP 500');
    expect(sendRequest.mock.calls[2][0].queryParams).toMatchObject({ $skip: '50' });
    expect(data.get('lastPoll')).toBe(CHECKPOINT);
  });

  it('fails on a time zone id the server cannot use instead of polling in UTC', async () => {
    const { store, data } = memoryStore({ lastPoll: CHECKPOINT });
    ok({ profiles: { general: { timezone: { id: 'Mars/Phobos' } } } });
    await expect(run({ trigger: newIssueTrigger, ctx: context({ store }) })).rejects.toThrow('"Mars/Phobos"');
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(data.get('lastPoll')).toBe(CHECKPOINT);
  });

  it('falls back to UTC only when the profile has no time zone', async () => {
    const { store } = memoryStore({ lastPoll: CHECKPOINT });
    ok({ profiles: { general: {} } });
    ok([]);
    await run({ trigger: newIssueTrigger, ctx: context({ store }) });
    expect(sendRequest.mock.calls[1][0].queryParams.query).toBe('created: 2026-11-05T10:00:00 .. * sort by: created asc');
  });

  it('at the 500-issue cap holds back issues tied with the last timestamp so the next poll gets them', async () => {
    const { store, data } = memoryStore({ lastPoll: CHECKPOINT });
    ok({ profiles: { general: { timezone: { id: 'UTC' } } } });
    const issues = Array.from({ length: 500 }, (_, i) => issue({ id: `I${i}`, created: i < 498 ? CHECKPOINT + 1 + i : CHECKPOINT + 1000 }));
    for (let page = 0; page < 10; page++) ok(issues.slice(page * 50, page * 50 + 50));
    const out = await run({ trigger: newIssueTrigger, ctx: context({ store }) });
    expect(Array.isArray(out) ? out.length : 0).toBe(498);
    expect(data.get('lastPoll')).toBe(CHECKPOINT + 498);
  });

  it('pages past already-seen issues at the checkpoint so one newer issue after them is not held back forever', async () => {
    const { store, data } = memoryStore({ lastPoll: CHECKPOINT });
    ok({ profiles: { general: { timezone: { id: 'UTC' } } } });
    const issues = [...Array.from({ length: 499 }, (_, i) => issue({ id: `OLD${i}`, created: CHECKPOINT })), issue({ id: 'NEW', created: CHECKPOINT + 500 })];
    for (let page = 0; page < 10; page++) ok(issues.slice(page * 50, page * 50 + 50));
    ok([]);
    const out = await run({ trigger: newIssueTrigger, ctx: context({ store }) });
    expect(out).toEqual([expect.objectContaining({ id: 'NEW' })]);
    expect(data.get('lastPoll')).toBe(CHECKPOINT + 500);
    expect(sendRequest.mock.calls[11][0].queryParams).toMatchObject({ $skip: '500' });
  });

  it('holds back trailing ties only among new issues once 500 new issues are collected', async () => {
    const { store, data } = memoryStore({ lastPoll: CHECKPOINT });
    ok({ profiles: { general: { timezone: { id: 'UTC' } } } });
    const seen = Array.from({ length: 50 }, (_, i) => issue({ id: `OLD${i}`, created: CHECKPOINT }));
    const fresh = Array.from({ length: 500 }, (_, i) => issue({ id: `N${i}`, created: i < 499 ? CHECKPOINT + 1 + i : CHECKPOINT + 2000 }));
    const all = [...seen, ...fresh];
    for (let page = 0; page < 11; page++) ok(all.slice(page * 50, page * 50 + 50));
    const out = await run({ trigger: newIssueTrigger, ctx: context({ store }) });
    expect(Array.isArray(out) ? out.length : 0).toBe(499);
    expect(data.get('lastPoll')).toBe(CHECKPOINT + 499);
    expect(sendRequest).toHaveBeenCalledTimes(12);
  });

  it('test mode reads the newest page without a checkpoint', async () => {
    const { store } = memoryStore({});
    ok([issue({ id: 'N', created: 2 })]);
    const out = await Reflect.apply(newIssueTrigger.test, undefined, [context({ store })]);
    expect(sendRequest.mock.calls[0][0].queryParams).toMatchObject({ query: 'sort by: created desc', $skip: '0' });
    expect(out).toEqual([expect.objectContaining({ id: 'N' })]);
  });

  it('onEnable stores only a checkpoint and makes no request', async () => {
    const { store, data } = memoryStore({});
    await Reflect.apply(newIssueTrigger.onEnable, undefined, [context({ store })]);
    expect(typeof data.get('lastPoll')).toBe('number');
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('updated_issue', () => {
  it('skips issues only touched at creation and emits real updates by updated time', async () => {
    const { store, data } = memoryStore({ lastPoll: CHECKPOINT });
    ok({ profiles: { general: { timezone: { id: 'UTC' } } } });
    ok([
      issue({ id: 'NEW', created: CHECKPOINT + 10, updated: CHECKPOINT + 500 }),
      issue({ id: 'EDIT', created: CHECKPOINT - 100000, updated: CHECKPOINT + 9000 }),
    ]);
    const out = await run({ trigger: updatedIssueTrigger, ctx: context({ store }) });
    expect(sendRequest.mock.calls[1][0].queryParams.query).toBe('updated: 2026-11-05T10:00:00 .. * sort by: updated asc');
    expect(out).toEqual([expect.objectContaining({ id: 'EDIT' })]);
    expect(data.get('lastPoll')).toBe(CHECKPOINT + 9000);
  });
  it('does not stall when one real update follows a full page of issues already seen at the checkpoint', async () => {
    const { store, data } = memoryStore({ lastPoll: CHECKPOINT });
    ok({ profiles: { general: { timezone: { id: 'UTC' } } } });
    const issues = [
      ...Array.from({ length: 499 }, (_, i) => issue({ id: `OLD${i}`, created: CHECKPOINT - 100000, updated: CHECKPOINT })),
      issue({ id: 'EDIT', created: CHECKPOINT - 100000, updated: CHECKPOINT + 700 }),
    ];
    for (let page = 0; page < 10; page++) ok(issues.slice(page * 50, page * 50 + 50));
    ok([]);
    const out = await run({ trigger: updatedIssueTrigger, ctx: context({ store }) });
    expect(out).toEqual([expect.objectContaining({ id: 'EDIT' })]);
    expect(data.get('lastPoll')).toBe(CHECKPOINT + 700);
  });

  it('does not let 600 issues only touched at creation fill the window and hide a later real edit', async () => {
    const { store, data } = memoryStore({ lastPoll: CHECKPOINT });
    ok({ profiles: { general: { timezone: { id: 'UTC' } } } });
    const issues = [
      ...Array.from({ length: 600 }, (_, i) => issue({ id: `IMPORTED${i}`, created: CHECKPOINT + 1 + i })),
      issue({ id: 'EDIT', created: CHECKPOINT - 100000, updated: CHECKPOINT + 5000 }),
    ];
    for (let page = 0; page < 13; page++) ok(issues.slice(page * 50, page * 50 + 50));
    const out = await run({ trigger: updatedIssueTrigger, ctx: context({ store }) });
    expect(out).toEqual([expect.objectContaining({ id: 'EDIT' })]);
    expect(data.get('lastPoll')).toBe(CHECKPOINT + 5000);
    expect(sendRequest).toHaveBeenCalledTimes(14);
  });
});

describe('formatYoutrackDateTimeLiteral', () => {
  it('renders in the given zone', () => {
    expect(formatYoutrackDateTimeLiteral({ epochMs: CHECKPOINT, timeZoneId: 'Asia/Tokyo' })).toBe('2026-11-05T19:00:00');
    expect(formatYoutrackDateTimeLiteral({ epochMs: CHECKPOINT, timeZoneId: null })).toBe('2026-11-05T10:00:00');
    expect(() => formatYoutrackDateTimeLiteral({ epochMs: CHECKPOINT, timeZoneId: 'Not/AZone' })).toThrow('"Not/AZone"');
  });
});
