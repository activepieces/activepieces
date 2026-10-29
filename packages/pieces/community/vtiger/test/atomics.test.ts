import { afterEach, describe, expect, test, vi } from 'vitest';
import { vtiger } from '../src/index';
import { addTagsToRecordAction } from '../src/lib/actions/ai/add-tags-to-record';
import { convertLeadAction } from '../src/lib/actions/ai/convert-lead';
import { createModuleRecordAction } from '../src/lib/actions/ai/create-module-record';
import { deleteRecordByIdAction } from '../src/lib/actions/ai/delete-record-by-id';
import { describeModuleAction } from '../src/lib/actions/ai/describe-module';
import { downloadAttachmentAction } from '../src/lib/actions/ai/download-attachment';
import { findOrCreateRecordAction } from '../src/lib/actions/ai/find-or-create-record';
import { findRecordsByEmailOrPhoneAction } from '../src/lib/actions/ai/find-records-by-email-or-phone';
import { getAccountHierarchyAction } from '../src/lib/actions/ai/get-account-hierarchy';
import { getCurrentUserAction } from '../src/lib/actions/ai/get-current-user';
import { getPicklistDependencyAction } from '../src/lib/actions/ai/get-picklist-dependency';
import { getRecordByIdAction } from '../src/lib/actions/ai/get-record-by-id';
import { getRecordTagsAction } from '../src/lib/actions/ai/get-record-tags';
import { linkRecordsAction } from '../src/lib/actions/ai/link-records';
import { listChangedRecordsAction } from '../src/lib/actions/ai/list-changed-records';
import { listModulesAction } from '../src/lib/actions/ai/list-modules';
import { listRelatedRecordsAction } from '../src/lib/actions/ai/list-related-records';
import { listRelationTypesAction } from '../src/lib/actions/ai/list-relation-types';
import { queryRelatedRecordsAction } from '../src/lib/actions/ai/query-related-records';
import { removeTagsFromRecordAction } from '../src/lib/actions/ai/remove-tags-from-record';
import { reopenRecordAction } from '../src/lib/actions/ai/reopen-record';
import { searchModuleRecordsAction } from '../src/lib/actions/ai/search-module-records';
import { unlinkRecordsAction } from '../src/lib/actions/ai/unlink-records';
import { updateRecordFieldsAction } from '../src/lib/actions/ai/update-record-fields';
import { basic, fail, ok, REST, runAction, stubVtiger } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function only<T>(seen: T[]): T {
  expect(seen).toHaveLength(1);
  return seen[0];
}

describe('piece surface', () => {
  const actions = Object.values(vtiger.actions());
  const ai = actions.filter((a) => a.audience === 'ai');

  test('24 ai atomics, 6 demoted, query_records stays both', () => {
    expect(ai).toHaveLength(24);
    expect(
      actions.filter((a) => a.audience === 'human' && a.name !== 'custom_api_call').map((a) => a.name).sort()
    ).toEqual(['create_record', 'delete_record', 'get_record', 'make_api_call', 'search_records', 'update_record']);
    expect(actions.find((a) => a.name === 'query_records')?.audience).toBe('both');
  });

  test('classification counts READ 7 / SEARCH 7 / WRITE 9 / DESTRUCTIVE 1', () => {
    const count = (c: string) => ai.filter((a) => a.classification === c).length;
    expect([count('READ'), count('SEARCH'), count('WRITE'), count('DESTRUCTIVE')]).toEqual([7, 7, 9, 1]);
  });

  test('every ai atomic has aiMetadata and an outputSchema', () => {
    for (const a of ai) {
      expect(a.aiMetadata?.description, a.name).toBeTruthy();
      expect(typeof a.aiMetadata?.idempotent, a.name).toBe('boolean');
      expect(a.outputSchema, a.name).toBeDefined();
    }
  });

  test('non-idempotent set matches the reviewed map (D7/D8)', () => {
    expect(ai.filter((a) => a.aiMetadata?.idempotent === false).map((a) => a.name).sort()).toEqual([
      'convert_lead',
      'create_module_record',
      'delete_record_by_id',
      'find_or_create_record',
      'reopen_record',
    ]);
  });

  test('release floor and ai props are plain text (no dropdowns)', () => {
    expect(vtiger.minimumSupportedRelease).toBe('0.88.2');
    for (const a of ai) {
      for (const [key, prop] of Object.entries(a.props)) {
        const type = typeof prop === 'object' && prop !== null && 'type' in prop ? prop.type : undefined;
        expect(['DROPDOWN', 'DYNAMIC', 'MULTI_SELECT_DROPDOWN'], `${a.name}.${key}`).not.toContain(type);
      }
    }
  });
});

describe('open-source instance (no REST v1)', () => {
  test.each([
    [getCurrentUserAction, {}],
    [searchModuleRecordsAction, { module: 'Contacts' }],
    [createModuleRecordAction, { module: 'Contacts', fields: { lastname: 'x' } }],
    [listChangedRecordsAction, { module: 'Contacts', modifiedSince: '1' }],
  ])('%#: REST 404 gives the Cloud-only message', async (action, props) => {
    stubVtiger([]);
    await expect(runAction({ action, props })).rejects.toThrow('needs the Vtiger Cloud REST API (/restapi/v1)');
  });
});

describe('READ atomics', () => {
  test('get_current_user GET /me', async () => {
    const seen = stubVtiger([{ method: 'GET', path: '/me', reply: ok({ id: '19x1', user_name: 'pat' }) }]);
    expect(await runAction({ action: getCurrentUserAction, props: {} })).toEqual({ id: '19x1', user_name: 'pat' });
    const req = only(seen);
    expect(req.path).toBe(`${REST}/me`);
    expect(req.headers.get('authorization')).toBe(basic());
  });

  test('list_modules GET /listtypes?fieldTypeList=null shapes modules', async () => {
    const seen = stubVtiger([
      {
        method: 'GET',
        path: '/listtypes',
        reply: ok({
          types: ['Contacts', 'HelpDesk'],
          information: { Contacts: { isEntity: true, label: 'Contacts', singular: 'Contact' }, HelpDesk: { isEntity: '1', label: 'Tickets', singular: 'Ticket' } },
        }),
      },
    ]);
    expect(await runAction({ action: listModulesAction, props: {} })).toEqual({
      modules: [
        { name: 'Contacts', label: 'Contacts', singular: 'Contact', isEntity: true },
        { name: 'HelpDesk', label: 'Tickets', singular: 'Ticket', isEntity: true },
      ],
      count: 2,
    });
    expect(only(seen).query).toEqual({ fieldTypeList: 'null' });
  });

  test('describe_module trims fields', async () => {
    const seen = stubVtiger([
      {
        method: 'GET',
        path: '/describe',
        reply: ok({
          name: 'Leads',
          label: 'Leads',
          idPrefix: '10',
          createable: true,
          updateable: true,
          deleteable: true,
          labelFields: 'firstname,lastname',
          fields: [
            { name: 'lastname', label: 'Last Name', mandatory: true, editable: true, type: { name: 'string' } },
            { name: 'leadstatus', label: 'Status', mandatory: false, type: { name: 'picklist', picklistValues: [{ label: 'Hot', value: 'Hot' }] } },
            { name: 'assigned_user_id', label: 'Assigned To', mandatory: true, type: { name: 'owner', refersTo: ['Users'] } },
          ],
        }),
      },
    ]);
    const out = await runAction({ action: describeModuleAction, props: { module: 'Leads' } });
    expect(only(seen).query).toEqual({ elementType: 'Leads' });
    expect(out).toMatchObject({
      name: 'Leads',
      labelFields: 'firstname,lastname',
      fieldCount: 3,
      fields: [
        { name: 'lastname', type: 'string', mandatory: true, picklistValues: [], refersTo: [] },
        { name: 'leadstatus', type: 'picklist', mandatory: false, picklistValues: ['Hot'] },
        { name: 'assigned_user_id', type: 'owner', refersTo: ['Users'] },
      ],
    });
  });

  test('get_record_by_id GET /retrieve?id', async () => {
    const seen = stubVtiger([{ method: 'GET', path: '/retrieve', reply: ok({ id: '4x7', lastname: 'Smith' }) }]);
    expect(await runAction({ action: getRecordByIdAction, props: { recordId: ' 4x7 ' } })).toEqual({
      id: '4x7',
      record: { id: '4x7', lastname: 'Smith' },
    });
    expect(only(seen).query).toEqual({ id: '4x7' });
  });

  test('get_record_by_id rejects a bare number before any request', async () => {
    const seen = stubVtiger([]);
    await expect(runAction({ action: getRecordByIdAction, props: { recordId: '7' } })).rejects.toThrow('webservice ID');
    expect(seen).toHaveLength(0);
  });

  test('list_changed_records GET /sync with unix seconds from ISO', async () => {
    const seen = stubVtiger([
      { method: 'GET', path: '/sync', reply: ok({ updated: [{ id: '4x1' }, '4x2'], deleted: ['4x3'], more: true, lastModifiedTime: 1767225600 }) },
    ]);
    const out = await runAction({
      action: listChangedRecordsAction,
      props: { module: 'Contacts', modifiedSince: '2026-01-01T00:00:00Z', syncType: 'user' },
    });
    expect(only(seen).query).toEqual({ modifiedTime: '1767225600', elementType: 'Contacts', syncType: 'user' });
    expect(out).toEqual({
      updatedIds: ['4x1', '4x2'],
      deletedIds: ['4x3'],
      updatedCount: 2,
      deletedCount: 1,
      more: true,
      lastModifiedTime: 1767225600,
    });
  });

  test('list_changed_records accepts unix seconds and ms', async () => {
    const seen = stubVtiger([{ method: 'GET', path: '/sync', reply: ok({ updated: [], deleted: [], more: false }) }]);
    await runAction({ action: listChangedRecordsAction, props: { module: 'Contacts', modifiedSince: '1767225600000' } });
    expect(seen[0].query['modifiedTime']).toBe('1767225600');
    expect(seen[0].query['syncType']).toBe('application');
  });

  test('list_relation_types GET /relatedtypes', async () => {
    const seen = stubVtiger([
      {
        method: 'GET',
        path: '/relatedtypes',
        reply: ok({
          types: ['Contacts', 'Calendar'],
          information: {
            '1': { name: 'Contacts', label: 'Contacts', translated_label: 'Contacts', relation_id: '1', actions: 'add' },
            '6': { name: 'Calendar', label: 'Activities', translated_label: 'Activities', relation_id: '6', actions: 'ADD' },
          },
        }),
      },
    ]);
    expect(await runAction({ action: listRelationTypesAction, props: { module: 'Accounts' } })).toEqual({
      relations: [
        { relationId: '1', relatedModule: 'Contacts', relationLabel: 'Contacts', translatedLabel: 'Contacts', actions: 'add' },
        { relationId: '6', relatedModule: 'Calendar', relationLabel: 'Activities', translatedLabel: 'Activities', actions: 'add' },
      ],
      count: 2,
    });
    expect(only(seen).query).toEqual({ elementType: 'Accounts' });
  });

  test('get_record_tags GET /tags_retrieve', async () => {
    const seen = stubVtiger([{ method: 'GET', path: '/tags_retrieve', reply: ok({ tags: ['vip', 'hot'] }) }]);
    expect(await runAction({ action: getRecordTagsAction, props: { recordId: '4x7' } })).toEqual({
      recordId: '4x7',
      tags: ['vip', 'hot'],
      count: 2,
    });
    expect(only(seen).query).toEqual({ id: '4x7' });
  });

  test('get_account_hierarchy GET /get_account_hierarchy', async () => {
    const seen = stubVtiger([{ method: 'GET', path: '/get_account_hierarchy', reply: ok({ '11x1': { accountname: 'Acme' } }) }]);
    expect(await runAction({ action: getAccountHierarchyAction, props: { accountId: '11x1' } })).toEqual({
      accountId: '11x1',
      hierarchy: { '11x1': { accountname: 'Acme' } },
    });
    expect(only(seen).query).toEqual({ id: '11x1' });
  });

  test('get_picklist_dependency GET /picklist_dependency with lower-case vendor params', async () => {
    const seen = stubVtiger([{ method: 'GET', path: '/picklist_dependency', reply: ok({ sourcefield: 'leadstatus', targetfield: 'rating', valuemapping: [{ sourcevalue: 'Hot', targetvalues: ['A'] }] }) }]);
    const out = await runAction({
      action: getPicklistDependencyAction,
      props: { module: 'Leads', sourceField: 'leadstatus', targetField: 'rating' },
    });
    expect(only(seen).query).toEqual({ module: 'Leads', sourcefield: 'leadstatus', targetfield: 'rating' });
    expect(out).toEqual({ module: 'Leads', sourceField: 'leadstatus', targetField: 'rating',
      hasDependency: true,
      mappings: [{ sourceValue: 'Hot', targetValues: ['A'] }],
    });
  });

  test('get_picklist_dependency normalises the empty [] reply', async () => {
    stubVtiger([{ method: 'GET', path: '/picklist_dependency', reply: ok([]) }]);
    const out = await runAction({
      action: getPicklistDependencyAction,
      props: { module: 'Leads', sourceField: 'leadsource', targetField: 'leadstatus' },
    });
    expect(out).toEqual({ module: 'Leads', sourceField: 'leadsource', targetField: 'leadstatus', hasDependency: false, mappings: [] });
  });

  test('download_attachment writes the decoded file and never returns base64', async () => {
    const seen = stubVtiger([
      {
        method: 'GET',
        path: '/files_retrieve',
        reply: ok([{ fileid: '55', filename: 'photo.png', filetype: 'image/png', filesize: '5', filecontents: Buffer.from('hello').toString('base64') }]),
      },
    ]);
    const write = vi.fn(async () => 'https://files/1');
    const out = await runAction({ action: downloadAttachmentAction, props: { attachmentId: '4x7_55' }, files: { write } });
    expect(only(seen).query).toEqual({ id: '4x7_55' });
    expect(write).toHaveBeenCalledWith({ fileName: 'photo.png', data: Buffer.from('hello') });
    expect(out).toEqual({ attachmentId: '4x7_55', fileName: 'photo.png', fileType: 'image/png', fileSize: 5, file: 'https://files/1' });
    expect(JSON.stringify(out)).not.toContain('aGVsbG8');
  });

  test('download_attachment rejects ids with separators', async () => {
    stubVtiger([]);
    await expect(
      runAction({ action: downloadAttachmentAction, props: { attachmentId: '../x' }, files: { write: vi.fn() } })
    ).rejects.toThrow('imageattachmentids');
  });
});

describe('SEARCH atomics', () => {
  test('find_records_by_email_or_phone GET /lookup', async () => {
    const seen = stubVtiger([{ method: 'GET', path: '/lookup', reply: ok([{ id: '4x1', email: 'a@b.c' }]) }]);
    const out = await runAction({
      action: findRecordsByEmailOrPhoneAction,
      props: { type: 'email', value: 'a@b.c', modules: ['Contacts'] },
    });
    expect(only(seen).query).toEqual({ type: 'email', value: 'a@b.c', searchIn: '["Contacts"]' });
    expect(out).toEqual({ records: [{ id: '4x1', email: 'a@b.c' }], count: 1 });
  });

  test('lookup defaults modules and rejects a bad type', async () => {
    const seen = stubVtiger([{ method: 'GET', path: '/lookup', reply: ok([]) }]);
    await runAction({ action: findRecordsByEmailOrPhoneAction, props: { type: 'phone', value: '+1 555' } });
    expect(seen[0].query['searchIn']).toBe('["Contacts","Leads","Accounts"]');
    await expect(
      runAction({ action: findRecordsByEmailOrPhoneAction, props: { type: 'fax', value: '1' } })
    ).rejects.toThrow('email or phone');
  });

  test('list_related_records GET /retrieve_related', async () => {
    const seen = stubVtiger([{ method: 'GET', path: '/retrieve_related', reply: ok([{ id: '4x1' }]) }]);
    const out = await runAction({
      action: listRelatedRecordsAction,
      props: { recordId: '11x1', relatedLabel: 'Contacts', relatedModule: 'Contacts' },
    });
    expect(only(seen).query).toEqual({ id: '11x1', relatedLabel: 'Contacts', relatedType: 'Contacts' });
    expect(out).toEqual({ records: [{ id: '4x1' }], count: 1 });
  });

  test('query_related_records GET /query_related with built VTQL and paging', async () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ id: `4x${i}` }));
    const seen = stubVtiger([{ method: 'GET', path: '/query_related', reply: ok(rows) }]);
    const out = await runAction({
      action: queryRelatedRecordsAction,
      props: { recordId: '11x1', relatedModule: 'Calendar', relatedLabel: 'Activities', limit: 10, offset: 20 },
    });
    expect(only(seen).query).toEqual({ query: 'SELECT * FROM Calendar LIMIT 20, 10', id: '11x1', relatedLabel: 'Activities' });
    expect(out).toEqual({ records: rows, count: 10, offset: 20, hasMore: true });
  });

  test('query_related_records caps limit at 100 and validates offset', async () => {
    const seen = stubVtiger([{ method: 'GET', path: '/query_related', reply: ok([]) }]);
    await runAction({ action: queryRelatedRecordsAction, props: { recordId: '11x1', relatedModule: 'Contacts', relatedLabel: 'Contacts', limit: 500 } });
    expect(seen[0].query['query']).toBe('SELECT * FROM Contacts LIMIT 0, 100');
    await expect(
      runAction({ action: queryRelatedRecordsAction, props: { recordId: '11x1', relatedModule: 'Contacts', relatedLabel: 'Contacts', offset: -1 } })
    ).rejects.toThrow('Offset');
    await expect(
      runAction({ action: queryRelatedRecordsAction, props: { recordId: '11x1', relatedModule: 'Contacts' } })
    ).rejects.toThrow('Relation Label is required');
  });

  test('search_module_records builds an escaped server-side WHERE and pages', async () => {
    const page = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `4x${i}` }));
    const seen = stubVtiger([
      { method: 'GET', path: '/query', reply: (req) => ok(req.query['query'].includes('LIMIT 0,') ? page(100) : page(5)) },
    ]);
    const out = await runAction({
      action: searchModuleRecordsAction,
      props: { module: 'Contacts', filters: { lastname: "D'Arcy", emailoptout: true }, match: 'contains', limit: 500 },
    });
    expect(seen.map((s) => s.query['query'])).toEqual([
      "SELECT * FROM Contacts WHERE lastname LIKE '%D\\'Arcy%' AND emailoptout = '1' LIMIT 0, 100;",
      "SELECT * FROM Contacts WHERE lastname LIKE '%D\\'Arcy%' AND emailoptout = '1' LIMIT 100, 100;",
    ]);
    expect(out).toMatchObject({ count: 105, hasMore: false });
  });

  test('search_module_records exact match by default, JSON string filters accepted', async () => {
    const seen = stubVtiger([{ method: 'GET', path: '/query', reply: ok([]) }]);
    await runAction({ action: searchModuleRecordsAction, props: { module: 'Leads', filters: '{"email":"a@b.c"}' } });
    expect(seen[0].query['query']).toBe("SELECT * FROM Leads WHERE email = 'a@b.c' LIMIT 0, 100;");
  });

  test('search_module_records rejects injected field names before any request', async () => {
    const seen = stubVtiger([]);
    await expect(
      runAction({ action: searchModuleRecordsAction, props: { module: 'Leads', filters: { '1=1 OR email': 'x' } } })
    ).rejects.toThrow('Invalid field name');
    expect(seen).toHaveLength(0);
  });
});

describe('WRITE / DESTRUCTIVE atomics', () => {
  test('create_module_record POST /create elementType + element JSON', async () => {
    const seen = stubVtiger([{ method: 'POST', path: '/create', reply: ok({ id: '4x9', lastname: 'Smith' }) }]);
    const out = await runAction({ action: createModuleRecordAction, props: { module: 'Contacts', fields: { lastname: 'Smith' } } });
    expect(only(seen).form).toEqual({ elementType: 'Contacts', element: '{"lastname":"Smith"}' });
    expect(out).toEqual({ id: '4x9', record: { id: '4x9', lastname: 'Smith' } });
  });

  test('create_module_record refuses empty fields or an id', async () => {
    stubVtiger([]);
    await expect(runAction({ action: createModuleRecordAction, props: { module: 'Contacts', fields: {} } })).rejects.toThrow('at least one');
    await expect(
      runAction({ action: createModuleRecordAction, props: { module: 'Contacts', fields: { id: '4x1', lastname: 'a' } } })
    ).rejects.toThrow('must not contain id');
    await expect(runAction({ action: createModuleRecordAction, props: { module: 'Contacts', fields: '[1]' } })).rejects.toThrow('JSON object');
  });

  test('update_record_fields POST /revise sends only the caller keys', async () => {
    const seen = stubVtiger([{ method: 'POST', path: '/revise', reply: ok({ id: '4x9', leadstatus: 'Hot' }) }]);
    const out = await runAction({ action: updateRecordFieldsAction, props: { recordId: '4x9', fields: { leadstatus: 'Hot', phone: '' } } });
    const req = only(seen);
    expect(req.path).toBe(`${REST}/revise`);
    expect(JSON.parse(req.form?.['element'] ?? '')).toEqual({ leadstatus: 'Hot', phone: '', id: '4x9' });
    expect(Object.keys(req.form ?? {})).toEqual(['element']);
    expect(out).toEqual({ id: '4x9', record: { id: '4x9', leadstatus: 'Hot' } });
  });

  test('update_record_fields rejects empty and mismatched id', async () => {
    stubVtiger([]);
    await expect(runAction({ action: updateRecordFieldsAction, props: { recordId: '4x9', fields: {} } })).rejects.toThrow('at least one');
    await expect(
      runAction({ action: updateRecordFieldsAction, props: { recordId: '4x9', fields: { id: '4x1', a: 'b' } } })
    ).rejects.toThrow('different from Record ID');
  });

  test('delete_record_by_id POST /delete', async () => {
    const seen = stubVtiger([{ method: 'POST', path: '/delete', reply: ok({ status: 'successful' }) }]);
    expect(await runAction({ action: deleteRecordByIdAction, props: { recordId: '4x9' } })).toEqual({ id: '4x9', deleted: true });
    expect(only(seen).form).toEqual({ id: '4x9' });
  });

  test('delete_record_by_id surfaces the vendor error on a missing record', async () => {
    stubVtiger([{ method: 'POST', path: '/delete', reply: fail({ code: 'RECORD_NOT_FOUND', message: 'not found' }) }]);
    await expect(runAction({ action: deleteRecordByIdAction, props: { recordId: '4x9' } })).rejects.toThrow('RECORD_NOT_FOUND: not found');
  });

  test('reopen_record POST /reopen', async () => {
    const seen = stubVtiger([{ method: 'POST', path: '/reopen', reply: ok({ message: 'Record reopened successfully.' }) }]);
    expect(await runAction({ action: reopenRecordAction, props: { recordId: '5x3' } })).toEqual({
      id: '5x3',
      reopened: true,
      message: 'Record reopened successfully.',
    });
    expect(only(seen).form).toEqual({ id: '5x3' });
  });

  test('link_records POST /add_related with relationIdLabel', async () => {
    const seen = stubVtiger([{ method: 'POST', path: '/add_related', reply: ok({ message: 'successful' }) }]);
    const out = await runAction({
      action: linkRecordsAction,
      props: { sourceRecordId: '11x1', relatedRecordId: '4x2', relationLabel: 'Contacts' },
    });
    expect(only(seen).form).toEqual({ sourceRecordId: '11x1', relatedRecordId: '4x2', relationIdLabel: 'Contacts' });
    expect(out).toMatchObject({ sourceRecordId: '11x1', relatedRecordId: '4x2', relationLabel: 'Contacts', linked: true });
  });

  test('unlink_records POST /delete_related', async () => {
    const seen = stubVtiger([{ method: 'POST', path: '/delete_related', reply: ok({ message: 'successful' }) }]);
    const out = await runAction({ action: unlinkRecordsAction, props: { sourceRecordId: '11x1', relatedRecordId: '4x2' } });
    expect(only(seen).form).toEqual({ sourceRecordId: '11x1', relatedRecordId: '4x2' });
    expect(out).toMatchObject({ unlinked: true });
  });

  test('add_tags_to_record POST /tags_add with a JSON array, deduplicated', async () => {
    const seen = stubVtiger([{ method: 'POST', path: '/tags_add', reply: ok({ message: 'tags added' }) }]);
    const out = await runAction({ action: addTagsToRecordAction, props: { recordId: '4x9', tags: ['vip', ' hot ', 'vip', ''] } });
    expect(only(seen).form).toEqual({ id: '4x9', tags: '["vip","hot"]' });
    expect(out).toEqual({ recordId: '4x9', tags: ['vip', 'hot'], message: 'tags added' });
  });

  test('remove_tags_from_record POST /tags_delete always sends delete_all=false (D1)', async () => {
    const seen = stubVtiger([{ method: 'POST', path: '/tags_delete', reply: ok([]) }]);
    await runAction({ action: removeTagsFromRecordAction, props: { recordId: '4x9', tags: ['vip'], delete_all: true } });
    expect(only(seen).form).toEqual({ id: '4x9', tags: '["vip"]', delete_all: 'false' });
    expect(Object.keys(removeTagsFromRecordAction.props)).not.toContain('delete_all');
  });

  test('tag actions refuse an empty tag list', async () => {
    stubVtiger([]);
    await expect(runAction({ action: addTagsToRecordAction, props: { recordId: '4x9', tags: [] } })).rejects.toThrow('at least one');
  });

  test('convert_lead POST /convertlead with the entities shape and /me as default owner', async () => {
    const seen = stubVtiger([
      { method: 'GET', path: '/me', reply: ok({ id: '19x1' }) },
      { method: 'POST', path: '/convertlead', reply: ok({ Contacts: '4x50', Accounts: '11x51', Potentials: '' }) },
    ]);
    const out = await runAction({
      action: convertLeadAction,
      props: {
        leadId: '10x5',
        createAccount: true,
        accountFields: { accountname: 'Acme' },
        createPotential: false,
        potentialFields: { potentialname: 'ignored' },
      },
    });
    expect(seen.map((s) => s.path)).toEqual([`${REST}/me`, `${REST}/convertlead`]);
    expect(JSON.parse(seen[1].form?.['element'] ?? '')).toEqual({
      leadId: '10x5',
      assignedTo: '19x1',
      entities: {
        Contacts: { create: true, name: 'Contacts' },
        Accounts: { accountname: 'Acme', create: true, name: 'Accounts' },
      },
    });
    expect(out).toMatchObject({ leadId: '10x5', contactId: '4x50', accountId: '11x51', potentialId: '' });
  });

  test('convert_lead requires the deal mandatory fields before any request', async () => {
    const seen = stubVtiger([]);
    await expect(
      runAction({
        action: convertLeadAction,
        props: { leadId: '10x5', assignedTo: '19x1', createPotential: true, potentialFields: { potentialname: 'X' } },
      })
    ).rejects.toThrow('closingdate, sales_stage');
    expect(seen).toHaveLength(0);
  });

  test('find_or_create_record returns the existing match without creating', async () => {
    const seen = stubVtiger([{ method: 'GET', path: '/query', reply: ok([{ id: '4x1', email: 'a@b.c' }]) }]);
    const out = await runAction({
      action: findOrCreateRecordAction,
      props: { module: 'Contacts', matchField: 'email', matchValue: 'a@b.c', fields: { lastname: 'A' } },
    });
    expect(only(seen).query['query']).toBe("SELECT * FROM Contacts WHERE email = 'a@b.c' LIMIT 0, 2;");
    expect(out).toEqual({ created: false, matchCount: 1, id: '4x1', record: { id: '4x1', email: 'a@b.c' } });
  });

  test('find_or_create_record creates with the match value when nothing matches', async () => {
    const seen = stubVtiger([
      { method: 'GET', path: '/query', reply: ok([]) },
      { method: 'POST', path: '/create', reply: ok({ id: '4x2', email: 'a@b.c', lastname: 'A' }) },
    ]);
    const out = await runAction({
      action: findOrCreateRecordAction,
      props: { module: 'Contacts', matchField: 'email', matchValue: 'a@b.c', fields: { lastname: 'A', email: 'other' } },
    });
    expect(JSON.parse(seen[1].form?.['element'] ?? '')).toEqual({ lastname: 'A', email: 'a@b.c' });
    expect(out).toMatchObject({ created: true, matchCount: 0, id: '4x2' });
  });
});
