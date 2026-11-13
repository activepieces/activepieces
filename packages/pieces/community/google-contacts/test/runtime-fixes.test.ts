import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const listConnections = vi.fn();

vi.mock('@googleapis/people', () => ({
  people: () => ({ people: { connections: { list: listConnections } } }),
}));

import '../src';
import { httpClient, HttpMethod, pollingHelper } from '@activepieces/pieces-common';
import { AppConnectionType, ExecutionType, Store, TriggerStrategy } from '@activepieces/pieces-framework';
import { googleContactsUpdateContactAction } from '../src/lib/action/update-contact';
import { googleContactsSearchContactsAction } from '../src/lib/action/search-contact';
import { googleContactNewOrUpdatedContact } from '../src/lib/trigger/new-contact';

describe('Update Contact', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('sends the PATCH to the contact named by a people/ resourceName', async () => {
    const sendRequest = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValue({ status: 200, headers: {}, body: { resourceName: 'people/c123' } });

    await googleContactsUpdateContactAction.run(updateContext({ resourceName: 'people/c123' }));

    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(sendRequest.mock.calls[0][0]).toMatchObject({
      method: HttpMethod.PATCH,
      url: 'https://people.googleapis.com/v1/people/c123:updateContact',
      queryParams: { updatePersonFields: 'names' },
    });
  });

  test('trims a bare contact ID and still targets people/{id}:updateContact', async () => {
    const sendRequest = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValue({ status: 200, headers: {}, body: {} });

    await googleContactsUpdateContactAction.run(updateContext({ resourceName: ' c123 ' }));

    expect(sendRequest.mock.calls[0][0].url).toBe(
      'https://people.googleapis.com/v1/people/c123:updateContact'
    );
  });
});

describe('Search Contacts', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('warms the search cache with an empty query before running the real one', async () => {
    const results = { results: [{ person: { resourceName: 'people/c1' } }] };
    const sendRequest = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: {} })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: results });

    const output = await googleContactsSearchContactsAction.run(searchContext());

    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(sendRequest.mock.calls[0][0]).toMatchObject({
      method: HttpMethod.GET,
      url: 'https://people.googleapis.com/v1/people:searchContacts',
      queryParams: { query: '', readMask: 'names,emailAddresses', pageSize: '1' },
    });
    expect(sendRequest.mock.calls[1][0]).toMatchObject({
      method: HttpMethod.GET,
      url: 'https://people.googleapis.com/v1/people:searchContacts',
      queryParams: { query: 'Jane', readMask: 'names,emailAddresses', pageSize: '10' },
    });
    expect(output).toEqual(results);
  });

  test('fails without sending the real search when the warm-up request fails', async () => {
    const sendRequest = vi
      .spyOn(httpClient, 'sendRequest')
      .mockRejectedValueOnce(new Error('warm-up failed'));

    await expect(googleContactsSearchContactsAction.run(searchContext())).rejects.toThrow(
      'warm-up failed'
    );
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });
});

describe('New or Updated Contact trigger', () => {
  const trigger = pollingTrigger();

  beforeEach(() => {
    listConnections.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("dates a contact by its CONTACT source, not a newer PROFILE source", async () => {
    const { store, values } = memoryStore();
    await trigger.onEnable(hookContext(store));
    const lastPoll = storedLastPoll(values);
    const editedSinceLastPoll = person({
      id: 'c-edited',
      sources: [
        { type: 'CONTACT', updateTime: isoAt(lastPoll + 1_000) },
        { type: 'PROFILE', updateTime: isoAt(lastPoll + 50_000) },
      ],
    });
    const profileOnlyChange = person({
      id: 'c-profile-only',
      sources: [
        { type: 'CONTACT', updateTime: isoAt(lastPoll - 60_000) },
        { type: 'PROFILE', updateTime: isoAt(lastPoll + 50_000) },
      ],
    });
    listConnections.mockResolvedValueOnce(page({ connections: [editedSinceLastPoll, profileOnlyChange] }));

    const emitted = await trigger.run(runContext(store));

    expect(emitted).toEqual([editedSinceLastPoll]);
    expect(storedLastPoll(values)).toBe(lastPoll + 1_000);
  });

  test('falls back to the newest non-CONTACT source when there is no CONTACT source', async () => {
    const { store, values } = memoryStore();
    await trigger.onEnable(hookContext(store));
    const lastPoll = storedLastPoll(values);
    const profileOnly = person({
      id: 'c-profile',
      sources: [
        { type: 'PROFILE', updateTime: isoAt(lastPoll + 2_000) },
        { type: 'DOMAIN_PROFILE', updateTime: isoAt(lastPoll + 7_000) },
      ],
    });
    listConnections.mockResolvedValueOnce(page({ connections: [profileOnly] }));

    const emitted = await trigger.run(runContext(store));

    expect(emitted).toEqual([profileOnly]);
    expect(storedLastPoll(values)).toBe(lastPoll + 7_000);
  });

  test('never emits a contact without an updateTime, and tolerates empty or missing sources', async () => {
    const { store, values } = memoryStore();
    await trigger.onEnable(hookContext(store));
    const lastPoll = storedLastPoll(values);
    const dated = person({
      id: 'c-dated',
      sources: [{ type: 'CONTACT', updateTime: isoAt(lastPoll + 1_000) }],
    });
    const undated = person({ id: 'c-undated', sources: [{ type: 'CONTACT' }] });
    const emptySources = person({ id: 'c-empty', sources: [] });
    const noMetadata = { resourceName: 'people/c-no-metadata' };
    const connections = [dated, undated, emptySources, noMetadata];
    listConnections.mockResolvedValue(page({ connections }));

    const emitted = await trigger.run(runContext(store));
    const sampled = await trigger.test(runContext(memoryStore().store));

    expect(emitted).toEqual([dated]);
    expect(sampled).toEqual([dated]);
  });

  test('stops requesting pages once a page ends on a contact older than the last poll', async () => {
    const { store, values } = memoryStore();
    await trigger.onEnable(hookContext(store));
    const lastPoll = storedLastPoll(values);
    const newest = contactAt({ id: 'c1', epochMs: lastPoll + 3_000 });
    const newer = contactAt({ id: 'c2', epochMs: lastPoll + 2_000 });
    const stillNew = contactAt({ id: 'c3', epochMs: lastPoll + 1_000 });
    const alreadySeen = contactAt({ id: 'c4', epochMs: lastPoll - 1_000 });
    const undated = person({ id: 'c5', sources: [] });
    scriptPages([
      page({ connections: [newest, newer], nextPageToken: 'page-2' }),
      page({ connections: [stillNew, alreadySeen, undated], nextPageToken: 'page-3' }),
      page({ connections: [contactAt({ id: 'c6', epochMs: lastPoll - 5_000 })] }),
    ]);

    const emitted = await trigger.run(runContext(store));

    expect(listConnections).toHaveBeenCalledTimes(2);
    expect(listConnections.mock.calls[1][0]).toMatchObject({ pageToken: 'page-2' });
    expect(emitted).toEqual([newest, newer, stillNew]);
  });

  test('test() pages through every page regardless of how old the contacts are', async () => {
    const now = Date.now();
    const first = contactAt({ id: 'c1', epochMs: now - 1_000 });
    const second = contactAt({ id: 'c2', epochMs: now - 2_000 });
    const third = contactAt({ id: 'c3', epochMs: now - 3_000 });
    scriptPages([
      page({ connections: [first], nextPageToken: 'page-2' }),
      page({ connections: [second], nextPageToken: 'page-3' }),
      page({ connections: [third] }),
    ]);

    const sampled = await trigger.test(runContext(memoryStore().store));

    expect(listConnections).toHaveBeenCalledTimes(3);
    expect(listConnections.mock.calls.map((call) => call[0].pageToken)).toEqual([
      undefined,
      'page-2',
      'page-3',
    ]);
    expect(sampled).toEqual([first, second, third]);
  });

  test('onDisable hands off to the polling helper', async () => {
    const onDisable = vi.spyOn(pollingHelper, 'onDisable');
    const { store } = memoryStore();

    await trigger.onDisable(hookContext(store));

    expect(onDisable).toHaveBeenCalledTimes(1);
    expect(onDisable.mock.calls[0][1]).toMatchObject({ store, auth: AUTH, propsValue: {} });
  });
});

function pollingTrigger() {
  const trigger = googleContactNewOrUpdatedContact;
  if (trigger.type !== TriggerStrategy.POLLING) {
    throw new Error('New or Updated Contact is expected to be a polling trigger');
  }
  return trigger;
}

function updateContext({ resourceName }: { resourceName: string }): UpdateContext {
  return {
    ...actionBase(),
    propsValue: {
      resourceName,
      etag: 'etag-1',
      updatePersonFields: ['names'],
      firstName: 'Jane',
      lastName: undefined,
      middleName: undefined,
      company: undefined,
      jobTitle: undefined,
      email: undefined,
      phoneNumber: undefined,
      updateNote: undefined,
    },
  };
}

function searchContext(): SearchContext {
  return {
    ...actionBase(),
    propsValue: {
      query: 'Jane',
      readMask: ['names', 'emailAddresses'],
      pageSize: 10,
    },
  };
}

function actionBase() {
  return {
    ...sharedContext(),
    store: memoryStore().store,
    executionType: ExecutionType.BEGIN,
    tags: { add: vi.fn() },
    server: SERVER,
    files: { write: vi.fn(), upload: vi.fn() },
    output: { update: vi.fn() },
    run: {
      id: 'run-1',
      canPause: false,
      stop: vi.fn(),
      respond: vi.fn(),
      createWaitpoint: vi.fn(),
      waitForWaitpoint: vi.fn(),
    },
  } satisfies Omit<UpdateContext, 'propsValue'>;
}

function hookContext(store: Store): TriggerHookContext {
  return {
    ...sharedContext(),
    propsValue: {},
    store,
    server: SERVER,
    setSchedule: vi.fn(),
  };
}

function runContext(store: Store): TriggerRunContext {
  return {
    ...hookContext(store),
    files: { write: vi.fn(), upload: vi.fn() },
  };
}

function sharedContext() {
  return {
    auth: AUTH,
    flows: { list: vi.fn(), current: { id: 'flow-1', version: { id: 'flow-version-1' } } },
    step: { name: 'step_1' },
    project: { id: 'project-1', externalId: async () => undefined },
    connections: { get: async () => null },
  };
}

function memoryStore() {
  const values = new Map<string, unknown>();
  const store: Store = {
    get: vi.fn().mockImplementation(async (key: string) => values.get(key) ?? null),
    put: vi.fn().mockImplementation(async (key: string, value: unknown) => {
      values.set(key, value);
      return value;
    }),
    delete: vi.fn().mockImplementation(async (key: string) => {
      values.delete(key);
    }),
  };
  return { store, values };
}

function storedLastPoll(values: Map<string, unknown>): number {
  const lastPoll = values.get('lastPoll');
  if (typeof lastPoll !== 'number') {
    throw new Error('lastPoll was not stored as a number');
  }
  return lastPoll;
}

function scriptPages(pages: ConnectionsPage[]): void {
  pages.forEach((scripted) => listConnections.mockResolvedValueOnce(scripted));
}

function page({
  connections,
  nextPageToken,
}: {
  connections: unknown[];
  nextPageToken?: string;
}): ConnectionsPage {
  return { data: { connections, nextPageToken } };
}

function contactAt({ id, epochMs }: { id: string; epochMs: number }) {
  return person({ id, sources: [{ type: 'CONTACT', updateTime: isoAt(epochMs) }] });
}

function person({ id, sources }: { id: string; sources: PersonSource[] }) {
  return { resourceName: `people/${id}`, metadata: { sources } };
}

function isoAt(epochMs: number): string {
  return new Date(epochMs).toISOString();
}

const AUTH = {
  type: AppConnectionType.OAUTH2,
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  client_id: 'client-id',
  client_secret: 'client-secret',
  redirect_url: 'https://example.com/redirect',
  token_type: 'Bearer',
  token_url: 'https://oauth2.googleapis.com/token',
  scope: 'email',
  claimed_at: Math.round(Date.now() / 1000),
  expires_in: 3600,
  data: {},
} satisfies Parameters<typeof googleContactsUpdateContactAction.run>[0]['auth'];

const SERVER = {
  apiUrl: 'https://api.example.com/',
  publicUrl: 'https://example.com/',
  token: 'server-token',
};

type UpdateContext = Extract<
  Parameters<typeof googleContactsUpdateContactAction.run>[0],
  { executionType: ExecutionType.BEGIN }
>;
type SearchContext = Extract<
  Parameters<typeof googleContactsSearchContactsAction.run>[0],
  { executionType: ExecutionType.BEGIN }
>;
type TriggerHookContext = Parameters<ReturnType<typeof pollingTrigger>['onEnable']>[0];
type TriggerRunContext = Parameters<ReturnType<typeof pollingTrigger>['run']>[0];
type PersonSource = { type: string; updateTime?: string };
type ConnectionsPage = { data: { connections: unknown[]; nextPageToken?: string } };
