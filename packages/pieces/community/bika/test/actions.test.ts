import { afterEach, describe, expect, test, vi } from 'vitest';
import { createRecordByIdAction } from '../src/lib/actions/ai/create-record-by-id';
import { deleteRecordByIdAction } from '../src/lib/actions/ai/delete-record-by-id';
import { findRecordsByIdAction } from '../src/lib/actions/ai/find-records-by-id';
import { getDatabaseFieldsByIdAction } from '../src/lib/actions/ai/get-database-fields-by-id';
import { getRecordByIdAction } from '../src/lib/actions/ai/get-record-by-id';
import { listDatabasesByIdAction } from '../src/lib/actions/ai/list-databases-by-id';
import { updateRecordByIdAction } from '../src/lib/actions/ai/update-record-by-id';
import { createRecordAction } from '../src/lib/actions/create-record';
import { deleteRecordAction } from '../src/lib/actions/delete-record';
import { findRecordAction } from '../src/lib/actions/find-record';
import { findRecordsAction } from '../src/lib/actions/find-records';
import { listSpacesAction } from '../src/lib/actions/list-spaces';
import { updateRecordAction } from '../src/lib/actions/update-record';
import { bikaHelpers } from '../src/lib/common/client';
import { context, ok, RECORDS_PATH, stubFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const record = { id: 'rec1', fields: { Name: 'Ada' }, createdAt: '2026-10-07T10:00:00.000Z', updatedAt: '2026-10-07T11:00:00.000Z' };
const file = { filename: 'photo.png', extension: 'png', data: Buffer.from('png'), base64: Buffer.from('png').toString('base64') };

describe('human actions', () => {
  test('create sends one request with typed values and no field re-fetch', async () => {
    const seen = stubFetch(() => ok({ records: [record] }));
    const result = await createRecordAction.run(
      context({ space_id: 'spc1', database_id: 'dat1', fields: { Name: 'Ada', Score: 5, Done: false, Empty: '', Tags: [], Sales: ['mem1'], Note: undefined } }),
    );
    expect(seen).toHaveLength(1);
    expect(seen[0].method).toBe('POST');
    expect(seen[0].path).toBe(RECORDS_PATH);
    expect(seen[0].json).toEqual({ fieldKey: 'name', records: [{ fields: { Name: 'Ada', Score: 5, Done: false, Sales: ['mem1'] } }] });
    expect(result).toEqual({ success: true, code: 200, message: 'SUCCESS', data: { records: [record] } });
  });

  test('create uploads files first and sends attachment ids', async () => {
    const seen = stubFetch((request) =>
      request.path.endsWith('/attachments') ? ok([{ id: 'att1', name: 'photo.png', mimeType: 'image/png', size: 3, path: 'p', bucket: 'b' }]) : ok({ records: [record] }),
    );
    await createRecordAction.run(context({ space_id: 'spc1', database_id: 'dat1', fields: { Name: 'Ada', Photo: file } }));
    expect(seen.map((request) => request.path)).toEqual(['/api/openapi/bika/v1/spaces/spc1/attachments', RECORDS_PATH]);
    expect(seen[1].json).toEqual({ fieldKey: 'name', records: [{ fields: { Name: 'Ada', Photo: [{ id: 'att1', name: 'photo.png' }] } }] });
  });

  test('create refuses an empty record and NaN numbers before any request', async () => {
    const seen = stubFetch(() => ok({}));
    await expect(createRecordAction.run(context({ space_id: 'spc1', database_id: 'dat1', fields: { Name: '' } }))).rejects.toThrow('at least one field');
    await expect(createRecordAction.run(context({ space_id: 'spc1', database_id: 'dat1', fields: { Score: Number.NaN } }))).rejects.toThrow('not a valid number');
    expect(seen).toHaveLength(0);
  });

  test('update sends PUT with only the filled fields', async () => {
    const seen = stubFetch(() => ok(record));
    const result = await updateRecordAction.run(context({ space_id: 'spc1', database_id: 'dat1', recordId: ' rec1 ', fields: { Name: 'Ada', Other: '' } }));
    expect(seen[0].method).toBe('PUT');
    expect(seen[0].path).toBe(`${RECORDS_PATH}/rec1`);
    expect(seen[0].json).toEqual({ fieldKey: 'name', fields: { Name: 'Ada' } });
    expect(result).toMatchObject({ success: true, data: record });
  });

  test('get and delete keep the Bika envelope', async () => {
    let seen = stubFetch(() => ok(record));
    expect(await findRecordAction.run(context({ space_id: 'spc1', database_id: 'dat1', recordId: 'rec1' }))).toMatchObject({ success: true, data: record });
    expect(seen[0].method).toBe('GET');
    seen = stubFetch(() => ok({ id: 'rec1', deleted: true }));
    expect(await deleteRecordAction.run(context({ space_id: 'spc1', database_id: 'dat1', recordId: 'rec1' }))).toMatchObject({ data: { id: 'rec1', deleted: true } });
    expect(seen[0].method).toBe('DELETE');
  });

  test('find follows the offset cursor up to Max Records', async () => {
    const seen = stubFetch((request) =>
      request.query.get('offset') === null
        ? ok({ records: [record, { ...record, id: 'rec2' }], hasMore: true, offset: 'cur1' })
        : ok({ records: [{ ...record, id: 'rec3' }], hasMore: true, offset: 'cur2' }),
    );
    const result = await findRecordsAction.run(context({ space_id: 'spc1', database_id: 'dat1', maxRecords: 3, pageSize: 2, filter: 'Name=="Ada"' }));
    expect(seen).toHaveLength(2);
    expect(seen[0].query.get('pageSize')).toBe('2');
    expect(seen[0].query.get('filter')).toBe('Name=="Ada"');
    expect(seen[1].query.get('offset')).toBe('cur1');
    expect(seen[1].query.get('pageSize')).toBe('1');
    expect(result.data.records.map((item) => item.id)).toEqual(['rec1', 'rec2', 'rec3']);
    expect(result.data).toMatchObject({ hasMore: true, offset: 'cur2' });
  });

  test('find stops after 20 requests on short pages and returns the cursor', async () => {
    vi.spyOn(bikaHelpers, 'wait').mockResolvedValue(undefined);
    const seen = stubFetch((_request, index) => ok({ records: [{ ...record, id: `rec${index}` }], hasMore: true, offset: `cur${index}` }));
    const result = await findRecordsAction.run(context({ space_id: 'spc1', database_id: 'dat1', maxRecords: 1000, pageSize: 50 }));
    expect(seen).toHaveLength(20);
    expect(result.data.records).toHaveLength(20);
    expect(result.data).toMatchObject({ hasMore: true, offset: 'cur19' });
  });

  test('find stops when Bika has no more records and defaults to 100', async () => {
    const seen = stubFetch(() => ok({ records: [record], hasMore: false }));
    const result = await findRecordsAction.run(context({ space_id: 'spc1', database_id: 'dat1' }));
    expect(seen).toHaveLength(1);
    expect(seen[0].query.get('pageSize')).toBe('100');
    expect(result.data).toEqual({ records: [record], hasMore: false, offset: null });
  });
});

describe('agent actions', () => {
  test('list spaces is flat', async () => {
    stubFetch(() => ok([{ id: 'spc1', name: 'Team', memberCount: 3, createdAt: '2026-01-01T00:00:00.000Z', subscription: { plan: 'FREE' } }]));
    expect(await listSpacesAction.run(context({}))).toEqual({
      spaces: [{ id: 'spc1', name: 'Team', plan: 'FREE', member_count: 3, created_at: '2026-01-01T00:00:00.000Z' }],
      count: 1,
    });
  });

  test('list databases keeps only databases', async () => {
    stubFetch(() =>
      ok([
        { id: 'rot1', name: 'ROOT', type: 'ROOT' },
        { id: 'dat1', name: 'CRM', type: 'DATABASE', parentId: 'nod1', path: '/ROOT/Sales' },
      ]),
    );
    expect(await listDatabasesByIdAction.run(context({ space_id: 'spc1' }))).toEqual({
      space_id: 'spc1',
      databases: [{ id: 'dat1', name: 'CRM', path: '/ROOT/Sales', parent_id: 'nod1' }],
      count: 1,
      truncated: false,
    });
  });

  test('get database fields says what is writable and how', async () => {
    stubFetch(() =>
      ok([
        { id: 'f1', name: 'Stage', type: 'SINGLE_SELECT', primary: false, property: { options: [{ id: 'o1', name: 'Open' }] } },
        { id: 'f2', name: 'Edited', type: 'MODIFIED_TIME', primary: false },
        { id: 'f3', name: 'Owner', type: 'MEMBER', property: {} },
      ]),
    );
    const result = await getDatabaseFieldsByIdAction.run(context({ space_id: 'spc1', database_id: 'dat1' }));
    expect(result.fields[0]).toMatchObject({ name: 'Stage', writable: true, options: ['Open'], value_format: 'string: one option name' });
    expect(result.fields[1]).toMatchObject({ name: 'Edited', writable: false, value_format: 'read-only' });
    expect(result.fields[2]).toMatchObject({ name: 'Owner', writable: true, value_format: 'array of member, team or role IDs' });
  });

  test('find records sends filter, fields, sort and limit, and caps long text', async () => {
    const long = 'x'.repeat(5000);
    const seen = stubFetch(() =>
      ok({
        records: [
          {
            id: 'rec1',
            fields: { Other: 'dropped', Notes: long, Files: [{ id: 'att1', name: 'a.png', size: 3, mimeType: 'image/png', url: 'https://s/a.png', thumbnailUrl: null }] },
            createdAt: '2026-10-07T10:00:00.000Z',
          },
        ],
        hasMore: true,
        offset: 'next',
      }),
    );
    const result = await findRecordsByIdAction.run(
      context({ space_id: 'spc1', database_id: 'dat1', filter: '{Stage}=="Open"', fields: ['Notes', 'Files'], sort_field: 'Notes', sort_order: 'desc', limit: 5 }),
    );
    expect(seen[0].query.get('pageSize')).toBe('5');
    expect([...seen[0].query.keys()].some((key) => key.startsWith('fields'))).toBe(false);
    expect(seen[0].query.get('sort[0][field]')).toBe('Notes');
    expect(seen[0].query.get('sort[0][order]')).toBe('desc');
    expect(seen[0].query.get('filter')).toBe('{Stage}=="Open"');
    expect(result).toMatchObject({ count: 1, has_more: true, next_offset: null, truncated_fields: ['Notes'] });
    expect(String(result.records[0].fields['Notes'])).toHaveLength(4000);
    expect(Object.keys(result.records[0].fields)).toEqual(['Notes', 'Files']);
    expect(result.records[0].fields['Files']).toEqual([{ id: 'att1', name: 'a.png', mime_type: 'image/png', size: 3, url: 'https://s/a.png' }]);
  });

  test('find records caps nested lists and objects and reports the field', async () => {
    const long = 'x'.repeat(5000);
    stubFetch(() =>
      ok({
        records: [
          {
            id: 'rec1',
            fields: {
              Nested: [[long]],
              Meta: { note: long, tags: Array.from({ length: 150 }, (_item, index) => `t${index}`) },
              Small: { note: 'ok', list: [['a']] },
            },
          },
        ],
        hasMore: false,
      }),
    );
    const result = await findRecordsByIdAction.run(context({ space_id: 'spc1', database_id: 'dat1' }));
    expect(result.truncated_fields).toEqual(['Nested', 'Meta']);
    expect(result.records[0].fields['Nested']).toEqual([['x'.repeat(4000)]]);
    expect(result.records[0].fields['Meta']).toEqual({ note: 'x'.repeat(4000), tags: Array.from({ length: 100 }, (_item, index) => `t${index}`) });
    expect(result.records[0].fields['Small']).toEqual({ note: 'ok', list: [['a']] });
  });

  test('find records validates limit and sort order before calling Bika', async () => {
    const seen = stubFetch(() => ok({ records: [], hasMore: false }));
    await expect(findRecordsByIdAction.run(context({ space_id: 'spc1', database_id: 'dat1', limit: 500 }))).rejects.toThrow('from 1 to 100');
    await expect(findRecordsByIdAction.run(context({ space_id: 'spc1', database_id: 'dat1', sort_order: 'up' }))).rejects.toThrow('asc');
    await expect(findRecordsByIdAction.run(context({ space_id: 'spc1', database_id: 'dat1', sort_field: 'Name', offset: 'abc' }))).rejects.toThrow('cannot page through sorted');
    expect(seen).toHaveLength(0);
  });

  test('unsorted find returns the cursor for the next page', async () => {
    const seen = stubFetch(() => ok({ records: [record], hasMore: true, offset: 'cur9' }));
    const result = await findRecordsByIdAction.run(context({ space_id: 'spc1', database_id: 'dat1', offset: 'cur8' }));
    expect(seen[0].query.get('offset')).toBe('cur8');
    expect(seen[0].query.get('pageSize')).toBe('20');
    expect(result).toMatchObject({ has_more: true, next_offset: 'cur9' });
  });

  test('get, create, update and delete return flat records', async () => {
    let seen = stubFetch(() => ok(record));
    expect(await getRecordByIdAction.run(context({ space_id: 'spc1', database_id: 'dat1', record_id: 'rec1' }))).toEqual({
      id: 'rec1',
      database_id: 'dat1',
      created_at: record.createdAt,
      updated_at: record.updatedAt,
      fields: { Name: 'Ada' },
      truncated_fields: [],
    });

    seen = stubFetch(() => ok({ records: [record] }));
    await createRecordByIdAction.run(context({ space_id: 'spc1', database_id: 'dat1', fields: '{"Name": "Ada", "Score": 5}' }));
    expect(seen[0].json).toEqual({ fieldKey: 'name', records: [{ fields: { Name: 'Ada', Score: 5 } }] });

    seen = stubFetch(() => ok(record));
    await updateRecordByIdAction.run(context({ space_id: 'spc1', database_id: 'dat1', record_id: 'rec1', fields: { Notes: null } }));
    expect(seen[0].json).toEqual({ fieldKey: 'name', fields: { Notes: null } });

    stubFetch(() => ok({ id: 'rec1', deleted: true }));
    expect(await deleteRecordByIdAction.run(context({ space_id: 'spc1', database_id: 'dat1', record_id: 'rec1' }))).toEqual({ id: 'rec1', deleted: true });
  });

  test('create refuses non-object or empty fields', async () => {
    const seen = stubFetch(() => ok({}));
    await expect(createRecordByIdAction.run(context({ space_id: 'spc1', database_id: 'dat1', fields: '[1]' }))).rejects.toThrow('JSON object');
    await expect(createRecordByIdAction.run(context({ space_id: 'spc1', database_id: 'dat1', fields: {} }))).rejects.toThrow('empty');
    await expect(createRecordByIdAction.run(context({ space_id: 'spc1', database_id: 'dat1', fields: '{bad' }))).rejects.toThrow('not valid JSON');
    expect(seen).toHaveLength(0);
  });
});
