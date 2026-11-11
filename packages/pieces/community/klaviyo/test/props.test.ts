import { AppConnectionType } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { klaviyoTransport } from '../src/lib/common/client';
import { allProfileIdsMultiSelectDropdown, listIdDropdown, normalizePhone, profileIdsMultiSelectDropdown } from '../src/lib/common/props';

function stub({ replies }: { replies: Reply[] }): URL[] {
  const seen: URL[] = [];
  vi.spyOn(klaviyoTransport, 'getDispatcher').mockResolvedValue({});
  vi.stubGlobal('fetch', async (input: string | URL) => {
    seen.push(new URL(String(input)));
    const reply = replies[Math.min(seen.length - 1, replies.length - 1)];
    return new Response(JSON.stringify(reply.body), { status: reply.status });
  });
  return seen;
}

function listPage({ ids, next }: { ids: string[]; next: string | null }): Reply {
  return { status: 200, body: { data: ids.map((id) => ({ type: 'list', id, attributes: { name: `List ${id}` } })), links: { next } } };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('klaviyo dropdowns', () => {
  test('lists page through links.next so list 11 is selectable', async () => {
    const first = Array.from({ length: 10 }, (_, index) => `L${index + 1}`);
    const seen = stub({ replies: [listPage({ ids: first, next: 'https://a.klaviyo.com/api/lists?page%5Bcursor%5D=p2' }), listPage({ ids: ['L11'], next: null })] });
    const state = await listIdDropdown.options({ auth: AUTH }, { searchValue: undefined, server: SERVER, project: PROJECT, flows: FLOWS, step: STEP });
    expect(state.options.map((option) => option.value)).toContain('L11');
    expect(seen[1].searchParams.get('page[cursor]')).toBe('p2');
  });

  test('list search uses an exact escaped name filter', async () => {
    const seen = stub({ replies: [listPage({ ids: ['L1'], next: null })] });
    await listIdDropdown.options({ auth: AUTH }, { searchValue: 'My "VIP"', server: SERVER, project: PROJECT, flows: FLOWS, step: STEP });
    expect(seen[0].searchParams.get('filter')).toBe('equals(name,"My \\"VIP\\"")');
  });

  test('profile search with @ filters by exact email; + by phone', async () => {
    const seen = stub({ replies: [{ status: 200, body: { data: [], links: { next: null } } }] });
    await allProfileIdsMultiSelectDropdown.options({ auth: AUTH }, { searchValue: 'a@b.com', server: SERVER, project: PROJECT, flows: FLOWS, step: STEP });
    await allProfileIdsMultiSelectDropdown.options({ auth: AUTH }, { searchValue: '+1 (500) 555-0006', server: SERVER, project: PROJECT, flows: FLOWS, step: STEP });
    await allProfileIdsMultiSelectDropdown.options({ auth: AUTH }, { searchValue: undefined, server: SERVER, project: PROJECT, flows: FLOWS, step: STEP });
    expect(seen[0].searchParams.get('filter')).toBe('equals(email,"a@b.com")');
    expect(seen[1].searchParams.get('filter')).toBe('equals(phone_number,"+15005550006")');
    expect(seen[2].searchParams.get('sort')).toBe('-created');
    expect(seen[2].searchParams.get('page[size]')).toBe('100');
  });

  test('list member dropdown searches members of the chosen list', async () => {
    const seen = stub({ replies: [{ status: 200, body: { data: [], links: { next: null } } }] });
    await profileIdsMultiSelectDropdown.options({ auth: AUTH, list_id: 'L/1' }, { searchValue: 'a@b.com', server: SERVER, project: PROJECT, flows: FLOWS, step: STEP });
    expect(seen[0].pathname).toBe('/api/lists/L%2F1/profiles');
    expect(seen[0].searchParams.get('filter')).toBe('equals(email,"a@b.com")');
  });

  test('an error disables the dropdown with the vendor reason', async () => {
    stub({ replies: [{ status: 403, body: { errors: [{ detail: 'Missing scope lists:read' }] } }] });
    const state = await listIdDropdown.options({ auth: AUTH }, { searchValue: undefined, server: SERVER, project: PROJECT, flows: FLOWS, step: STEP });
    expect(state.disabled).toBe(true);
    expect(state.placeholder).toContain('Missing scope lists:read');
  });

  test('qa: more than 1000 lists leaves a searchable empty dropdown that says to type the exact name', async () => {
    const ids = Array.from({ length: 10 }, (_, index) => `L${index}`);
    const seen = stub({ replies: [listPage({ ids, next: 'https://a.klaviyo.com/api/lists?page%5Bcursor%5D=more' })] });
    const state = await listIdDropdown.options({ auth: AUTH }, { searchValue: undefined, server: SERVER, project: PROJECT, flows: FLOWS, step: STEP });
    expect(seen).toHaveLength(100);
    expect(state.disabled).toBe(false);
    expect(state.options).toEqual([]);
    expect(state.placeholder).toContain('More than 1000 lists');
  });

  test('normalizePhone strips separators and adds a missing +', () => {
    expect(normalizePhone('1 (500) 555-0006')).toBe('+15005550006');
    expect(normalizePhone('+44 20.7946.0000')).toBe('+442079460000');
  });
});

const AUTH: { type: AppConnectionType.SECRET_TEXT; secret_text: string } = { type: AppConnectionType.SECRET_TEXT, secret_text: 'pk_test' };

const SERVER = { apiUrl: 'http://localhost:3000/api/', publicUrl: 'http://localhost:4200/', token: 't' };

const PROJECT = { id: 'p', externalId: async () => undefined };

const FLOWS = { list: async () => ({ data: [], next: null, previous: null }), current: { id: 'f', version: { id: 'v' } } };

const STEP = { name: 's' };

type Reply = { status: number; body: unknown };
