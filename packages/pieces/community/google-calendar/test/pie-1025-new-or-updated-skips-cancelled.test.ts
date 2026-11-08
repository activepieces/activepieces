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

import { calendarEventChanged } from '../src/lib/triggers/calendar-event';

type Event = { id: string; status: string; summary?: string; created: string; updated: string };
let calendar: Event[] = [];

function fakeEventsList(request: { queryParams: Record<string, string> }) {
  const updatedMin = new Date(request.queryParams['updatedMin']).getTime();
  const items = calendar.filter((event) => new Date(event.updated).getTime() >= updatedMin);
  return Promise.resolve({ status: 200, headers: {}, body: { items, nextPageToken: undefined } });
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

describe('PIE-1025 New or Updated Event', () => {
  it('fires for added and updated events but not for a deleted (cancelled) event', async () => {
    const store = memoryStore();
    const ctx = {
      store,
      auth: { access_token: 'x' },
      propsValue: { calendar_id: 'primary', expandRecurringEvent: false },
      files: {},
    };

    const enabledAt = Date.now();
    await Reflect.apply(calendarEventChanged.onEnable, calendarEventChanged, [ctx]);
    const at = (ms: number) => new Date(enabledAt + ms).toISOString();

    calendar = [
      { id: 'added', status: 'confirmed', summary: 'Kickoff', created: at(10_000), updated: at(10_000) },
      { id: 'updated', status: 'confirmed', summary: 'Weekly sync (moved)', created: at(-86_400_000), updated: at(20_000) },
      { id: 'deleted', status: 'cancelled', created: at(-86_400_000), updated: at(30_000) },
    ];

    const fired: Event[] = await Reflect.apply(calendarEventChanged.run, calendarEventChanged, [ctx]);

    expect(sendRequest).toHaveBeenCalled();
    expect(fired.map((event) => event.id).sort()).toEqual(['added', 'updated']);
  });
});
