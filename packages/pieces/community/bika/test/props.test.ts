import { afterEach, describe, expect, test, vi } from 'vitest';
import { bikaProps } from '../src/lib/common/props';
import { connection, ok, stubFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

const ctx = { server: { apiUrl: '', publicUrl: '', token: '' }, project: { id: 'p', externalId: async () => undefined }, flows: {} };

describe('dropdowns', () => {
  test('database dropdown lists only databases with their folder', async () => {
    stubFetch(() =>
      ok([
        { id: 'rot1', name: 'ROOT', type: 'ROOT' },
        { id: 'dat1', name: 'CRM Database', type: 'DATABASE', path: '/ROOT/A Simple CRM' },
        { id: 'dat2', name: 'Top', type: 'DATABASE', path: '/ROOT' },
      ]),
    );
    const result = await bikaProps.database().options({ auth: connection(), space_id: 'spc1' }, ctx);
    expect(result).toEqual({
      disabled: false,
      options: [
        { label: 'CRM Database (A Simple CRM)', value: 'dat1' },
        { label: 'Top', value: 'dat2' },
      ],
    });
  });

  test('dropdowns show a reason instead of throwing', async () => {
    stubFetch(() => ({ status: 429, body: { success: false, code: 429, message: 'API_REQUEST quota exceeded' } }));
    const spaces = await bikaProps.space().options({ auth: connection() }, ctx);
    expect(spaces).toMatchObject({ disabled: true, placeholder: expect.stringContaining('quota') });
    expect(await bikaProps.database().options({ auth: connection(), space_id: undefined }, ctx)).toMatchObject({ disabled: true, placeholder: 'Select a space first.' });
  });

  test('fields offer an input per writable type, with arrays for member and link', async () => {
    stubFetch(() =>
      ok([
        { id: 'f1', name: 'Name', type: 'LONG_TEXT' },
        { id: 'f2', name: 'Sales', type: 'MEMBER', property: {} },
        { id: 'f3', name: 'Stage', type: 'SINGLE_SELECT', property: { options: [{ id: 'o1', name: 'Open' }] } },
        { id: 'f4', name: 'Edited', type: 'MODIFIED_TIME' },
        { id: 'f5', name: 'Count', type: 'AUTO_NUMBER' },
        { id: 'f6', name: 'Period', type: 'DATERANGE' },
        { id: 'f7', name: 'Visits', type: 'ONE_WAY_LINK' },
        { id: 'f8', name: 'Files', type: 'ATTACHMENT' },
        { id: 'f9', name: 'Score', type: 'RATING' },
      ]),
    );
    const props = await bikaProps.fields({ description: 'x' }).props({ auth: connection(), space_id: 'spc1', database_id: 'dat1' }, ctx);
    const types = Object.fromEntries(Object.entries(props).map(([name, prop]) => [name, Reflect.get(prop, 'type')]));
    expect(types).toEqual({
      Name: 'LONG_TEXT',
      Sales: 'ARRAY',
      Stage: 'STATIC_DROPDOWN',
      Period: 'SHORT_TEXT',
      Visits: 'ARRAY',
      Files: 'FILE',
      Score: 'NUMBER',
    });
  });
});
