import { afterEach, describe, expect, test, vi } from 'vitest';
import { customFields, publicationId, subscriptionId } from '../src/lib/common/props';
import { API_KEY, AUTH, PUB, stubBeehiiv } from './helpers';

afterEach(() => vi.restoreAllMocks());

const CTX = {
  server: { apiUrl: '', publicUrl: '', token: '' },
  project: { id: 'p', externalId: async () => undefined },
  flows: { list: async () => ({ data: [], next: null, previous: null }), current: { id: 'f', version: { id: 'v' } } },
  connections: { get: async () => null },
};

describe('dropdowns', () => {
  test('subscription dropdown without search shows the 100 newest, one request, no offset paging', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: [{ id: 'sub_1', email: 'a@x.com' }], has_more: true, next_cursor: 'c' } }] });
    const state = await subscriptionId(true).options({ auth: AUTH, publicationId: PUB }, CTX);
    expect(seen).toHaveLength(1);
    expect(seen[0].query.get('limit')).toBe('100');
    expect(seen[0].query.get('direction')).toBe('desc');
    expect(seen[0].query.has('page')).toBe(false);
    expect(state.options).toEqual([{ label: 'a@x.com', value: 'sub_1' }]);
    expect(state.placeholder).toContain('exact email');
  });

  test('subscription dropdown search uses the exact email filter', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: [], has_more: false, next_cursor: null } }] });
    const state = await subscriptionId(true).options({ auth: AUTH, publicationId: PUB }, { ...CTX, searchValue: ' A+b@X.com ' });
    expect(seen[0].query.get('email')).toBe('A+b@X.com');
    expect(state.placeholder).toBe('No subscriber has this exact email');
  });

  test('subscription dropdown asks for a publication first', async () => {
    const state = await subscriptionId(true).options({ auth: AUTH }, CTX);
    expect(state).toEqual({ disabled: true, options: [], placeholder: 'Select a publication first.' });
  });

  test('a failed load returns a disabled state with the reason instead of throwing', async () => {
    stubBeehiiv({ replies: [{ status: 500, body: { errors: [{ message: 'boom' }] } }] });
    const state = await publicationId.options({ auth: AUTH }, CTX);
    expect(state.disabled).toBe(true);
    expect(state.placeholder).toContain('boom');
  });
});

describe('custom fields dynamic prop', () => {
  test('sends Bearer <secret_text>, not the auth object, and maps double to a number', async () => {
    const seen = stubBeehiiv({
      replies: [
        {
          body: {
            data: [
              { id: '1', kind: 'string', display: 'Company' },
              { id: '2', kind: 'double', display: 'Rate' },
              { id: '3', kind: 'list', display: 'Interests' },
            ],
            total_pages: 1,
          },
        },
      ],
    });
    const fields = await customFields.props({ auth: AUTH, publicationId: PUB }, CTX);
    expect(seen[0].headers.get('authorization')).toBe(`Bearer ${API_KEY}`);
    expect(seen[0].path).toBe(`/v2/publications/${PUB}/custom_fields`);
    expect(Object.keys(fields)).toEqual(['Company', 'Rate', 'Interests']);
    expect(Reflect.get(Object(fields['Rate']), 'type')).toBe('NUMBER');
  });

  test('a failed load shows a markdown note instead of throwing', async () => {
    stubBeehiiv({ replies: [{ status: 401, body: { errors: [{ message: 'bad key' }] } }] });
    const fields = await customFields.props({ auth: AUTH, publicationId: PUB }, CTX);
    expect(Object.keys(fields)).toEqual(['custom_fields_error']);
  });
});
