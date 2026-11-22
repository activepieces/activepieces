import { afterEach, describe, expect, it, vi } from 'vitest';
import newEntry from '../src/lib/triggers/new-entry';
import newAbsence from '../src/lib/triggers/new-absence-enquiry';
import { createMockPollingTriggerContext, InputPropertyMap } from '@activepieces/pieces-framework';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) } };
});

const sendRequest = vi.fn();


const AUTH = {
  email: ' me@example.org ',
  token: ' key-1 ',
  company_name: 'Acme',
  company_email: 'dev@acme.test',
};

const BASE = 'https://my.clockodo.com/api';

function ok(body: unknown) {
  return { status: 200, headers: {}, body };
}

function memoryStore() {
  const data = new Map<string, unknown>();
  return {
    data,
    store: {
      put: async (key: string, value: unknown) => {
        data.set(key, value);
        return value;
      },
      get: async (key: string) => (data.has(key) ? data.get(key) : null),
      delete: async (key: string) => {
        data.delete(key);
      },
    },
  };
}

function triggerContext({ store }: { store: ReturnType<typeof memoryStore>['store'] }) {
  const base = createMockPollingTriggerContext<InputPropertyMap>({ propsValue: {} });
  return { ...base, store, auth: { type: 'CUSTOM_AUTH', props: AUTH } };
}

afterEach(() => {
  sendRequest.mockReset();
  vi.useRealTimers();
});

function call({ hook, context }: { hook: unknown; context: unknown }): Promise<unknown> {
  return Reflect.apply(Function.prototype.call, hook, [undefined, context]);
}

describe('new entry trigger', () => {
  it('pages every page, emits a back-dated entry exactly once and never re-emits', async () => {
    const { store } = memoryStore();
    const context = triggerContext({ store });
    sendRequest.mockResolvedValue(ok({ entries: [{ id: 10 }, { id: 11 }], paging: { count_pages: 1 } }));
    await call({ hook: newEntry.onEnable, context });

    sendRequest.mockReset();
    sendRequest
      .mockResolvedValueOnce(ok({ entries: [{ id: 12, time_since: '2026-09-01T09:00:00Z' }, { id: 10 }], paging: { count_pages: 2 } }))
      .mockResolvedValueOnce(ok({ entries: [{ id: 11 }, { id: 13 }], paging: { count_pages: 2 } }));
    const first = await call({ hook: newEntry.run, context });
    expect(first).toEqual([{ id: 12, time_since: '2026-09-01T09:00:00Z' }, { id: 13 }]);
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(sendRequest.mock.calls[0][0].url).toBe(BASE + '/v2/entries');

    sendRequest.mockReset();
    sendRequest.mockResolvedValue(ok({ entries: [{ id: 10 }, { id: 11 }, { id: 12 }, { id: 13 }], paging: { count_pages: 1 } }));
    await expect(call({ hook: newEntry.run, context })).resolves.toEqual([]);
  });

  it('queries a 90-day look-back window', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-22T12:00:00Z'));
    const { store } = memoryStore();
    sendRequest.mockResolvedValue(ok({ entries: [], paging: { count_pages: 1 } }));
    await call({ hook: newEntry.onEnable, context: triggerContext({ store }) });
    expect(sendRequest.mock.calls[0][0].queryParams).toMatchObject({
      time_since: '2026-08-24T12:00:00Z',
      time_until: '2026-12-22T12:00:00Z',
    });
  });

  it('starts from a fresh checkpoint without flooding when upgraded from the old trigger', async () => {
    const { store } = memoryStore();
    sendRequest.mockResolvedValue(ok({ entries: [{ id: 1 }, { id: 2 }], paging: { count_pages: 1 } }));
    await expect(call({ hook: newEntry.run, context: triggerContext({ store }) })).resolves.toEqual([]);
    sendRequest.mockResolvedValue(ok({ entries: [{ id: 1 }, { id: 2 }, { id: 3 }], paging: { count_pages: 1 } }));
    await expect(call({ hook: newEntry.run, context: triggerContext({ store }) })).resolves.toEqual([{ id: 3 }]);
  });

  it('does not advance the checkpoint when a page fails', async () => {
    const { store, data } = memoryStore();
    const context = triggerContext({ store });
    sendRequest.mockResolvedValue(ok({ entries: [{ id: 1 }], paging: { count_pages: 1 } }));
    await call({ hook: newEntry.onEnable, context });
    sendRequest.mockReset();
    sendRequest
      .mockResolvedValueOnce(ok({ entries: [{ id: 2 }], paging: { count_pages: 2 } }))
      .mockRejectedValueOnce(new Error('boom'))
      .mockRejectedValueOnce(new Error('boom'))
      .mockRejectedValueOnce(new Error('boom'));
    vi.useFakeTimers();
    const pending = call({ hook: newEntry.run, context }).catch((e: unknown) => e);
    await vi.runAllTimersAsync();
    expect(String(await pending)).toMatch(/did not complete/);
    expect([...data.values()]).toEqual([1]);
  });
});

describe('new absence enquiry trigger', () => {
  it('reads previous, current and next year so year-boundary absences fire once', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-12-30T12:00:00Z'));
    const { store } = memoryStore();
    const context = triggerContext({ store });
    sendRequest.mockResolvedValue(ok({ data: [{ id: 1 }] }));
    await call({ hook: newAbsence.onEnable, context });
    expect(sendRequest.mock.calls.map((c) => c[0].queryParams['filter[year]'])).toEqual(['2025', '2026', '2027']);
    expect(sendRequest.mock.calls[0][0].url).toBe(BASE + '/v4/absences');

    sendRequest.mockReset();
    sendRequest
      .mockResolvedValueOnce(ok({ data: [{ id: 1 }] }))
      .mockResolvedValueOnce(ok({ data: [{ id: 1 }, { id: 5, date_since: '2026-12-31', date_until: '2027-01-02' }] }))
      .mockResolvedValueOnce(ok({ data: [{ id: 5, date_since: '2026-12-31', date_until: '2027-01-02' }, { id: 6 }] }));
    await expect(call({ hook: newAbsence.run, context })).resolves.toEqual([
      { id: 5, date_since: '2026-12-31', date_until: '2027-01-02', half_day: false },
      { id: 6, half_day: false },
    ]);
  });
});
