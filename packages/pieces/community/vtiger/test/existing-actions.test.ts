import { afterEach, describe, expect, test, vi } from 'vitest';
import { createRecord } from '../src/lib/actions/create-record';
import { deleteRecord } from '../src/lib/actions/delete-record';
import { getRecord } from '../src/lib/actions/get-record';
import { customApiCallAuthHeaders, makeAPICall, resolveCustomCallTarget } from '../src/lib/actions/make-api-call';
import { queryRecords } from '../src/lib/actions/query-records';
import { searchFiltersFromFields, searchRecords } from '../src/lib/actions/search-record';
import { updateRecord } from '../src/lib/actions/update-record';
import { getRecordReference, listModuleNames, moduleLabeler } from '../src/lib/common';
import {
  fetchChangedRecords,
  fetchNewestRecords,
  vtigerTimeToEpochMs,
} from '../src/lib/triggers/new-or-updated-record';
import { vtwsLogin } from '../src/lib/vtws';
import { auth, basic, creds, fail, INSTANCE, ok, REST, runAction, stubVtiger, vtwsRoutes } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('B3 VTWS login and failures throw', () => {
  test('getchallenge sends the username as an encoded query param', async () => {
    const seen = stubVtiger(vtwsRoutes());
    const session = await vtwsLogin(creds({ username: 'pat+crm@acme.com' }));
    expect(session.sessionName).toBe('sess1');
    expect(seen[0].query).toEqual({ operation: 'getchallenge', username: 'pat+crm@acme.com' });
    expect(seen[0].url).toContain('username=pat%2Bcrm%40acme.com');
    expect(seen[1].form).toEqual({
      operation: 'login',
      username: 'pat+crm@acme.com',
      accessKey: expect.stringMatching(/^[0-9a-f]{32}$/),
    });
    expect(seen.every((s) => s.dispatcher !== undefined)).toBe(true);
  });

  test('missing challenge token throws instead of a TypeError', async () => {
    stubVtiger([{ method: 'GET', path: '/webservice.php', operation: 'getchallenge', reply: ok({}) }]);
    await expect(vtwsLogin(creds())).rejects.toThrow('CHALLENGE_FAILED');
  });

  test('login failure fails the step (was: returned null)', async () => {
    stubVtiger([
      vtwsRoutes()[0],
      { method: 'POST', path: '/webservice.php', operation: 'login', reply: fail({ code: 'INVALID_AUTH_TOKEN', message: 'Specified token is invalid or expired' }) },
    ]);
    await expect(
      runAction({ action: getRecord, props: { elementType: 'Contacts', record: { id: '4x1' } } })
    ).rejects.toThrow('INVALID_AUTH_TOKEN: Specified token is invalid or expired');
  });

  test('delete of a missing id throws (was: returned the error envelope as success)', async () => {
    stubVtiger(
      vtwsRoutes([
        { method: 'POST', path: '/webservice.php', operation: 'delete', reply: fail({ code: 'INVALID_ID_ATTRIBUTE', message: 'Id specified is incorrect' }) },
      ])
    );
    await expect(
      runAction({ action: deleteRecord, props: { elementType: 'Contacts', record: { id: '4x999' } } })
    ).rejects.toThrow('INVALID_ID_ATTRIBUTE: Id specified is incorrect');
  });

  test('create keeps the envelope output shape and sends element JSON', async () => {
    const seen = stubVtiger(
      vtwsRoutes([{ method: 'POST', path: '/webservice.php', operation: 'create', reply: ok({ id: '4x7', lastname: 'Smith' }) }])
    );
    const out = await runAction({ action: createRecord, props: { elementType: 'Contacts', record: { lastname: 'Smith' } } });
    expect(out).toEqual({ success: true, result: { id: '4x7', lastname: 'Smith' } });
    expect(seen[2].form).toEqual({
      operation: 'create',
      sessionName: 'sess1',
      elementType: 'Contacts',
      element: '{"lastname":"Smith"}',
    });
  });

  test('get retrieves by id with GET query params', async () => {
    const seen = stubVtiger(
      vtwsRoutes([{ method: 'GET', path: '/webservice.php', operation: 'retrieve', reply: ok({ id: '4x7' }) }])
    );
    const out = await runAction({ action: getRecord, props: { elementType: 'Contacts', record: { id: '4x7' } } });
    expect(out).toEqual({ success: true, result: { id: '4x7' } });
    expect(seen[2].query).toEqual({ operation: 'retrieve', sessionName: 'sess1', elementType: 'Contacts', id: '4x7' });
  });
});

describe('B2 query_records', () => {
  test('success:false throws instead of returning {error}', async () => {
    stubVtiger(
      vtwsRoutes([{ method: 'GET', path: '/webservice.php', operation: 'query', reply: fail({ code: 'QUERY_SYNTAX_ERROR', message: 'Syntax error' }) }])
    );
    await expect(runAction({ action: queryRecords, props: { query: 'SELECT * FROM' } })).rejects.toThrow(
      'QUERY_SYNTAX_ERROR: Syntax error'
    );
  });

  test('returns the row array and documents paging', async () => {
    const seen = stubVtiger(vtwsRoutes([{ method: 'GET', path: '/webservice.php', operation: 'query', reply: ok([{ count: '3' }]) }]));
    const out = await runAction({ action: queryRecords, props: { query: 'SELECT count(*) FROM Contacts;' } });
    expect(out).toEqual([{ count: '3' }]);
    expect(seen[2].query['query']).toBe('SELECT count(*) FROM Contacts;');
    expect(queryRecords.props.query.description).toContain('LIMIT offset, count');
  });
});

describe('B1 search_records searches past record 100 server-side', () => {
  test('pages with a WHERE clause instead of count(*) + client scan', async () => {
    const page = ({ n, from }: { n: number; from: number }) => Array.from({ length: n }, (_, i) => ({ id: `4x${from + i}` }));
    const seen = stubVtiger(
      vtwsRoutes([
        {
          method: 'GET',
          path: '/webservice.php',
          operation: 'query',
          reply: (req) => ok(req.query['query'].includes('LIMIT 0, 100') ? page({ n: 100, from: 0 }) : page({ n: 30, from: 100 })),
        },
      ])
    );
    const out = await runAction({
      action: searchRecords,
      props: { elementType: 'Contacts', fields: { lastname: "O'Hara", emailoptout: false, do_not_call: true }, limit: undefined },
    });
    expect(Array.isArray(out) && out.length).toBe(130);
    const queries = seen.filter((s) => s.query['operation'] === 'query').map((s) => s.query['query']);
    expect(queries).toEqual([
      "SELECT * FROM Contacts WHERE lastname LIKE '%O\\'Hara%' AND do_not_call = '1' LIMIT 0, 100;",
      "SELECT * FROM Contacts WHERE lastname LIKE '%O\\'Hara%' AND do_not_call = '1' LIMIT 100, 100;",
    ]);
    expect(queries.some((q) => q.includes('count(*)'))).toBe(false);
  });

  test('filter mapping skips empty text and unchecked boxes', () => {
    expect(searchFiltersFromFields({ a: '', b: false, c: undefined, d: 5, e: 'x' })).toEqual([
      { field: 'd', value: '5', operator: '=' },
      { field: 'e', value: 'x', operator: 'LIKE' },
    ]);
  });

  test('module name is validated before any request (B7)', async () => {
    const seen = stubVtiger(vtwsRoutes());
    await expect(
      runAction({ action: searchRecords, props: { elementType: 'Contacts WHERE 1=1', fields: {} } })
    ).rejects.toThrow('Invalid module name');
    expect(seen).toHaveLength(0);
  });
});

describe('B4/B11 update_record', () => {
  test('run uses revise (not full update) and the selected id wins over a field named id', async () => {
    const seen = stubVtiger(
      vtwsRoutes([{ method: 'POST', path: '/webservice.php', operation: 'revise', reply: ok({ id: '4x7', lastname: 'New' }) }])
    );
    const out = await runAction({
      action: updateRecord,
      props: { elementType: 'Contacts', id: '4x7', record: { lastname: 'New', id: '4x1' } },
    });
    expect(out).toEqual({ success: true, result: { id: '4x7', lastname: 'New' } });
    expect(seen[2].form?.['operation']).toBe('revise');
    expect(JSON.parse(seen[2].form?.['element'] ?? '{}')).toEqual({ lastname: 'New', id: '4x7' });
  });

  test('id dropdown logs in once (no retry loop / sleep after success) and caps at 100', async () => {
    const seen = stubVtiger(
      vtwsRoutes([{ method: 'GET', path: '/webservice.php', operation: 'query', reply: ok([{ id: '4x1', email: 'a@b.c' }]) }])
    );
    const started = Date.now();
    const options = await Reflect.apply(updateRecord.props.id.options, undefined, [{ auth: auth(), elementType: 'Contacts' }, {}]);
    expect(Date.now() - started).toBeLessThan(1000);
    expect(options).toEqual({ disabled: false, options: [{ label: 'a@b.c', value: '4x1' }] });
    expect(seen.filter((s) => s.query['operation'] === 'getchallenge')).toHaveLength(1);
    expect(seen[2].query['query']).toBe('SELECT * FROM Contacts LIMIT 100;');
  });

  test('id dropdown shows the reason when login fails', async () => {
    stubVtiger([{ method: 'GET', path: '/webservice.php', operation: 'getchallenge', reply: fail({ code: 'INVALID_USER', message: 'no such user' }) }]);
    const options = await Reflect.apply(updateRecord.props.id.options, undefined, [{ auth: auth(), elementType: 'Contacts' }, {}]);
    expect(options).toEqual({ disabled: true, options: [], placeholder: 'Could not load records: INVALID_USER: no such user' });
  });
});

describe('B5 module labels do not leak credentials across connections', () => {
  test('each connection describes with its own credentials', async () => {
    const seen = stubVtiger([
      { method: 'GET', path: '/describe', reply: ok({ labelFields: 'accountname', fields: [] }) },
    ]);
    const first = creds({ instance_url: 'https://one.od2.vtiger.com', username: 'a', password: 'A' });
    const second = creds({ instance_url: 'https://two.od2.vtiger.com', username: 'b', password: 'B' });
    expect(await moduleLabeler({ creds: first, module: 'Accounts' })({ accountname: 'Acme' })).toBe('Acme');
    expect(await moduleLabeler({ creds: second, module: 'Accounts' })({ accountname: 'Beta' })).toBe('Beta');
    expect(seen.map((s) => [s.origin, s.headers.get('authorization')])).toEqual([
      ['https://one.od2.vtiger.com', basic(first)],
      ['https://two.od2.vtiger.com', basic(second)],
    ]);
  });
});

describe('B10 reference dropdowns are capped and labelled', () => {
  test('getRecordReference queries LIMIT 100 and reports failures', async () => {
    const seen = stubVtiger(
      vtwsRoutes([{ method: 'GET', path: '/webservice.php', operation: 'query', reply: ok([{ id: '19x1', user_name: 'admin' }]) }])
    );
    const state = await getRecordReference({ auth: auth(), modules: ['Users'] });
    expect(state).toEqual({ disabled: false, options: [{ label: 'admin', value: '19x1' }] });
    expect(seen[2].query['query']).toBe('SELECT * FROM Users LIMIT 100;');
    const bad = await getRecordReference({ auth: auth(), modules: ['Users; x'] });
    expect(bad.disabled).toBe(true);
  });
});

describe('B6 deprecated make_api_call stays on the instance', () => {
  test.each([
    ['https://evil.example/x', 'must point to the connected instance'],
    ['https://acme.od2.vtiger.com.evil.io/webservice.php', 'must point to the connected instance'],
    ['http://acme.od2.vtiger.com/webservice.php', 'must point to the connected instance'],
    ['https://u:p@acme.od2.vtiger.com/webservice.php', 'must point to the connected instance'],
    ['//evil.example/x', 'not a valid URL'],
  ])('rejects %s', (url, message) => {
    expect(() => resolveCustomCallTarget({ creds: creds(), url })).toThrow(message);
  });

  test('relative paths go to the REST base', () => {
    expect(resolveCustomCallTarget({ creds: creds(), url: '/me' })).toEqual({
      url: `${INSTANCE}/restapi/v1/vtiger/default/me`,
      useRestAuth: true,
    });
    expect(resolveCustomCallTarget({ creds: creds(), urlPath: '/me' }).useRestAuth).toBe(true);
    expect(() => resolveCustomCallTarget({ creds: creds(), urlPath: 'me' })).toThrow('must start with a slash');
  });

  test('cross-origin URL sends nothing, so no sessionName leaves the instance', async () => {
    const seen = stubVtiger(vtwsRoutes());
    await expect(
      runAction({ action: makeAPICall, props: { method: 'GET', url: 'https://evil.example/collect', data: {} } })
    ).rejects.toThrow('must point to the connected instance');
    expect(seen).toHaveLength(0);
  });

  test('same-origin webservice URL gets the session; a user Authorization header is dropped', async () => {
    const seen = stubVtiger(
      vtwsRoutes([{ method: 'GET', path: '/webservice.php', operation: 'listtypes', reply: ok({ types: ['Contacts'] }) }])
    );
    const out = await runAction({
      action: makeAPICall,
      props: {
        method: 'GET',
        url: `${INSTANCE}/webservice.php`,
        headers: { Authorization: 'Bearer x' },
        data: { operation: 'listtypes' },
      },
    });
    expect(out).toEqual({ success: true, result: { types: ['Contacts'] } });
    expect(seen[2].query).toEqual({ operation: 'listtypes', sessionName: 'sess1' });
    expect(seen[2].headers.get('authorization')).toBeNull();
  });

  test('non-2xx throws instead of returning {error}', async () => {
    stubVtiger([{ method: 'GET', path: '/me', reply: { status: 500, body: { message: 'boom' } } }]);
    await expect(runAction({ action: makeAPICall, props: { method: 'GET', url: '/me' } })).rejects.toThrow();
  });
});

describe('Custom API Call only sends credentials to the connected REST base', () => {
  test.each([
    'https://evil.example/collect',
    'https://acme.od2.vtiger.com.evil.io/restapi/v1/vtiger/default/me',
    'http://acme.od2.vtiger.com/restapi/v1/vtiger/default/me',
    'https://u:p@acme.od2.vtiger.com/restapi/v1/vtiger/default/me',
    'https://acme.od2.vtiger.com/webservice.php',
    'https://acme.od2.vtiger.com/restapi/v1/vtiger/defaultx/me',
  ])('refuses %s', (url) => {
    expect(() => customApiCallAuthHeaders({ creds: creds(), url })).toThrow('must point to the connected instance');
  });

  test.each(['/me', 'me', `${INSTANCE}/restapi/v1/vtiger/default/me`, `${INSTANCE}/restapi/v1/vtiger/default`])(
    'allows %s',
    (url) => {
      expect(customApiCallAuthHeaders({ creds: creds(), url })).toEqual({ Authorization: basic() });
    }
  );
});

describe('B9 trigger', () => {
  test('a record deleted between sync and retrieve is skipped; the rest are delivered', async () => {
    stubVtiger([
      { method: 'GET', path: '/sync', reply: ok({ updated: ['4x1', '4x2', '4x3'], deleted: [], more: false, lastModifiedTime: 200 }) },
      {
        method: 'GET',
        path: '/retrieve',
        reply: (req) => (req.query['id'] === '4x2' ? { status: 400 } : ok({ id: req.query['id'] })),
      },
    ]);
    const out = await fetchChangedRecords({ creds: creds(), module: 'Contacts', syncType: 'application', limit: 100, lastFetchEpochMS: 100_000 });
    expect(out.map((r) => r['id'])).toEqual(['4x1', '4x3']);
  });

  test('RECORD_NOT_FOUND from webservice.php is skipped', async () => {
    stubVtiger(
      vtwsRoutes([
        { method: 'GET', path: `${REST}/sync`, reply: { status: 404 } },
        { method: 'GET', path: '/webservice.php', operation: 'sync', reply: ok({ updated: ['12x4', '12x5'], deleted: [], more: false, lastModifiedTime: 5 }) },
        {
          method: 'GET',
          path: '/webservice.php',
          operation: 'retrieve',
          reply: (req) =>
            req.query['id'] === '12x4' ? fail({ code: 'RECORD_NOT_FOUND', message: 'Record not found' }) : ok({ id: '12x5' }),
        },
      ])
    );
    const out = await fetchChangedRecords({ creds: creds(), module: 'Contacts', syncType: 'application', limit: 100, lastFetchEpochMS: 1_000_000 });
    expect(out).toEqual([{ id: '12x5' }]);
  });

  test.each([
    ['permission', { status: 403 }],
    ['server error', { status: 500 }],
  ])('a %s error on retrieve still fails the poll', async (_label, reply) => {
    stubVtiger([
      { method: 'GET', path: '/sync', reply: ok({ updated: ['4x1'], deleted: [], more: false, lastModifiedTime: 200 }) },
      { method: 'GET', path: '/retrieve', reply },
    ]);
    await expect(
      fetchChangedRecords({ creds: creds(), module: 'Contacts', syncType: 'application', limit: 100, lastFetchEpochMS: 100_000 })
    ).rejects.toThrow();
  });

  test('Vtiger times are parsed as UTC', () => {
    expect(vtigerTimeToEpochMs('2026-01-02 03:04:05')).toBe(Date.UTC(2026, 0, 2, 3, 4, 5));
    expect(vtigerTimeToEpochMs('')).toBe(0);
    expect(vtigerTimeToEpochMs('garbage')).toBe(0);
  });

  test('test() reads the 5 newest records with one query (no full sync)', async () => {
    const seen = stubVtiger([{ method: 'GET', path: '/query', reply: ok([{ id: '4x9' }]) }]);
    const out = await fetchNewestRecords({ creds: creds(), module: 'Contacts', watchBy: 'createdtime' });
    expect(out).toEqual([{ id: '4x9' }]);
    expect(seen).toHaveLength(1);
    expect(seen[0].query['query']).toBe('SELECT * FROM Contacts ORDER BY createdtime DESC LIMIT 5;');
  });

  test('sync skips deleted ids, follows more with the cursor and stops if the cursor does not move', async () => {
    const seen = stubVtiger([
      {
        method: 'GET',
        path: '/sync',
        reply: (req) =>
          req.query['modifiedTime'] === '100'
            ? ok({ updated: ['4x1', '4x2'], deleted: ['4x2'], more: true, lastModifiedTime: 200 })
            : ok({ updated: [{ id: '4x3' }], deleted: [], more: true, lastModifiedTime: 200 }),
      },
      { method: 'GET', path: '/retrieve', reply: (req) => ok({ id: req.query['id'], modifiedtime: '2026-01-01 00:00:00' }) },
    ]);
    const out = await fetchChangedRecords({
      creds: creds(),
      module: 'Contacts',
      syncType: 'application',
      limit: 100,
      lastFetchEpochMS: 100_000,
    });
    expect(out.map((r) => r['id'])).toEqual(['4x1', '4x3']);
    expect(seen.filter((s) => s.path.endsWith('/sync')).map((s) => s.query['modifiedTime'])).toEqual(['100', '200']);
  });

  test('open-source fallback: REST 404 switches to webservice.php sync and uses the records it returns', async () => {
    const seen = stubVtiger(
      vtwsRoutes([
        { method: 'GET', path: `${REST}/sync`, reply: { status: 404, body: '<html>Not Found</html>' } },
        {
          method: 'GET',
          path: '/webservice.php',
          operation: 'sync',
          reply: ok({
            updated: [{ id: '12x4', lastname: 'A', modifiedtime: '2026-10-11 19:35:26' }, { id: '12x5', lastname: 'B' }],
            deleted: ['12x5'],
            more: false,
            lastModifiedTime: 1791747326,
          }),
        },
      ])
    );
    const out = await fetchChangedRecords({ creds: creds(), module: 'Contacts', syncType: 'application', limit: 100, lastFetchEpochMS: 1_000_000 });
    expect(out).toEqual([{ id: '12x4', lastname: 'A', modifiedtime: '2026-10-11 19:35:26' }]);
    const vtwsSync = seen.find((s) => s.query['operation'] === 'sync');
    expect(vtwsSync?.query).toEqual({ modifiedTime: '1000', elementType: 'Contacts', syncType: 'application', operation: 'sync', sessionName: 'sess1' });
    expect(seen.filter((s) => s.query['operation'] === 'retrieve')).toHaveLength(0);
  });

  test('open-source fallback retrieves ids through webservice.php when sync returns bare ids', async () => {
    const seen = stubVtiger(
      vtwsRoutes([
        { method: 'GET', path: `${REST}/sync`, reply: { status: 404 } },
        { method: 'GET', path: '/webservice.php', operation: 'sync', reply: ok({ updated: ['12x4'], deleted: [], more: false, lastModifiedTime: 5 }) },
        { method: 'GET', path: '/webservice.php', operation: 'retrieve', reply: ok({ id: '12x4' }) },
      ])
    );
    const out = await fetchChangedRecords({ creds: creds(), module: 'Contacts', syncType: 'application', limit: 100, lastFetchEpochMS: 0 });
    expect(out).toEqual([{ id: '12x4' }]);
    expect(seen.filter((s) => s.path.startsWith(REST))).toHaveLength(1);
  });

  test('open-source fallback for test(): VTWS query of the newest 5', async () => {
    const seen = stubVtiger(
      vtwsRoutes([
        { method: 'GET', path: `${REST}/query`, reply: { status: 404 } },
        { method: 'GET', path: '/webservice.php', operation: 'query', reply: ok([{ id: '12x4' }]) },
      ])
    );
    expect(await fetchNewestRecords({ creds: creds(), module: 'Contacts', watchBy: 'modifiedtime' })).toEqual([{ id: '12x4' }]);
    expect(seen.find((s) => s.query['operation'] === 'query')?.query['query']).toBe(
      'SELECT * FROM Contacts ORDER BY modifiedtime DESC LIMIT 5;'
    );
  });

  test('Cloud path never calls webservice.php', async () => {
    const seen = stubVtiger([
      { method: 'GET', path: '/sync', reply: ok({ updated: ['4x1'], deleted: [], more: false, lastModifiedTime: 9 }) },
      { method: 'GET', path: '/retrieve', reply: ok({ id: '4x1' }) },
    ]);
    await fetchChangedRecords({ creds: creds(), module: 'Contacts', syncType: 'application', limit: 100, lastFetchEpochMS: 0 });
    expect(seen.every((s) => s.path.startsWith(REST))).toBe(true);
  });

  test('module dropdown falls back to webservice.php listtypes on open-source', async () => {
    stubVtiger(
      vtwsRoutes([
        { method: 'GET', path: `${REST}/listtypes`, reply: { status: 404 } },
        { method: 'GET', path: '/webservice.php', operation: 'listtypes', reply: ok({ types: ['Contacts', 'Leads'] }) },
      ])
    );
    const names = await listModuleNames(creds());
    expect(names).toContain('Leads');
    expect(names).toContain('Contacts');
  });

  test('sync failure throws instead of silently returning nothing', async () => {
    stubVtiger([{ method: 'GET', path: '/sync', reply: fail({ code: 'ACCESS_DENIED', message: 'denied' }) }]);
    await expect(
      fetchChangedRecords({ creds: creds(), module: 'Contacts', syncType: 'application', limit: 10, lastFetchEpochMS: 0 })
    ).rejects.toThrow('ACCESS_DENIED: denied');
  });
});
