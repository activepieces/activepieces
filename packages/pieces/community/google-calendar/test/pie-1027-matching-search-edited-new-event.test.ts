
const sendRequest = vi.fn();
vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) } };
});
vi.mock('../src/lib/auth', () => ({
  googleCalendarAuth: {},
  googleCalendarScopes: [],
  createGoogleClient: vi.fn().mockResolvedValue({}),
  getAccessToken: vi.fn().mockResolvedValue('an-access-token'),
}));

import { newEventMatchingSearch } from '../src/lib/triggers/new-event-matching-search';

type Event = { id: string; status: string; summary: string; created: string; updated: string };
let calendar: Event[] = [];

function fakeEventsList(request: { queryParams: Record<string, string> }) {
  const updatedMin = new Date(request.queryParams['updatedMin']).getTime();
  const q = (request.queryParams['q'] ?? '').toLowerCase();
  const items = calendar.filter(
    (event) => new Date(event.updated).getTime() >= updatedMin && event.summary.toLowerCase().includes(q),
  );
  return Promise.resolve({ status: 200, headers: {}, body: { items } });
}

function memoryStore() {
  const data = new Map<string, unknown>();
  return {
    get: async (key: string) => (data.has(key) ? data.get(key) : null),
    put: async (key: string, value: unknown) => {
      data.set(key, value);
      return value;
    },
    delete: async (key: string) => {
      data.delete(key);
    },
  };
}

beforeEach(() => {
  calendar = [];
  sendRequest.mockReset();
  sendRequest.mockImplementation(fakeEventsList);
});

describe('PIE-1027 New Event Matching Search', () => {
  it('fires once for every new matching event, also when it was edited after creation, and not for old events', async () => {
    const store = memoryStore();
    const ctx = {
      store,
      auth: { access_token: 'x' },
      propsValue: { calendar_id: 'primary', search_term: 'Interview' },
      files: {},
    };

    const enabledAt = Date.now();
    await Reflect.apply(newEventMatchingSearch.onEnable, newEventMatchingSearch, [ctx]);
    const at = (ms: number) => new Date(enabledAt + ms).toISOString();

    calendar = [
      { id: 'new-untouched', status: 'confirmed', summary: 'Interview: Sam', created: at(10_000), updated: at(10_500) },
      { id: 'new-then-edited', status: 'confirmed', summary: 'Interview: Jane', created: at(20_000), updated: at(50_000) },
      { id: 'old-edited', status: 'confirmed', summary: 'Interview: Old', created: at(-86_400_000), updated: at(60_000) },
    ];

    const firstPoll: Event[] = await Reflect.apply(newEventMatchingSearch.run, newEventMatchingSearch, [ctx]);
    const secondPoll: Event[] = await Reflect.apply(newEventMatchingSearch.run, newEventMatchingSearch, [ctx]);

    expect(firstPoll.map((event) => event.id).sort()).toEqual(['new-then-edited', 'new-untouched']);
    expect(secondPoll).toEqual([]);
  });
});
