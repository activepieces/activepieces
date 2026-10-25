import { afterEach, describe, expect, test, vi } from 'vitest';
import { findRecords } from '../src/lib/actions/find-records';
import { deleteRecord } from '../src/lib/actions/delete-record';
import { createRecord } from '../src/lib/actions/create-record';
import { upsertRecord, upsertRecordById } from '../src/lib/actions/upsert-record';
import { bulkCreateRecords } from '../src/lib/actions/bulk-create-records';
import { bulkUpdateRecords } from '../src/lib/actions/bulk-update-records';
import { bulkDeleteRecords } from '../src/lib/actions/bulk-delete-records';
import { listSolutions } from '../src/lib/actions/list-solutions';
import { getTableSchema } from '../src/lib/actions/get-table-schema';
import { addComment, addCommentById } from '../src/lib/actions/add-comment';
import { addField } from '../src/lib/actions/add-field';
import { getFileUrl, getFileUrlByHandle } from '../src/lib/actions/get-file-url';
import { listMembers } from '../src/lib/actions/list-members';
import { listRecordsAi } from '../src/lib/actions/ai/list-records';
import { updateRecordFieldsAi } from '../src/lib/actions/ai/update-record-fields';
import { createRecordByIdAi } from '../src/lib/actions/ai/create-record-by-id';
import { deleteRecordByIdAi } from '../src/lib/actions/ai/delete-record-by-id';
import { attachFileByIdAi } from '../src/lib/actions/ai/attach-file-by-id';
import { smartsuite } from '../src/index';
import { field, run, SeenRequest, stubFetch } from './helpers';


const TABLE = {
	id: 't1',
	name: 'Tasks',
	slug: 'sx',
	solution: 's1',
	structure: [
		{ slug: 'title', label: 'Title', field_type: 'recordtitlefield', params: { required: true } },
		{ slug: 's_sel', label: 'Stage', field_type: 'singleselectfield', params: { choices: [{ label: 'New', value: 'new', value_color: '#fff' }] } },
		{ slug: 'first_created', label: 'First Created', field_type: 'firstcreatedfield', params: { system: true } },
	],
};

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('find_records', () => {
	test('stops when total is reached (no extra empty call) and maps labels', async () => {
		const seen = stubFetch((request: SeenRequest) =>
			request.path.endsWith('/records/list/') ? { body: { items: [{ id: 'r1', title: 'A' }], total: 1 } } : { body: TABLE },
		);
		const result = await run(findRecords)({ tableId: 't1', searchField: 'title', searchValue: 'A' });
		expect(result).toEqual({ found: true, result: [{ id: 'r1', Title: 'A' }], hasMore: false });
		expect(seen.filter((r) => r.path.endsWith('/records/list/'))).toHaveLength(1);
		expect(seen[1].body).toEqual({ filter: { operator: 'and', fields: [{ field: 'title', comparison: 'is', value: 'A' }] } });
	});
	test('Max Records caps paging and reports hasMore', async () => {
		const seen = stubFetch((request: SeenRequest) =>
			request.path.endsWith('/records/list/')
				? { body: { items: Array.from({ length: Number(request.query.get('limit')) }, (_, i) => ({ id: `r${i}` })), total: 50 } }
				: { body: TABLE },
		);
		const result = await run(findRecords)({ tableId: 't1', searchField: 'title', searchValue: 'A', maxRecords: 3 });
		expect(field({ value: result, key: 'result' })).toHaveLength(3);
		expect(field({ value: result, key: 'hasMore' })).toBe(true);
		expect(seen[1].query.get('limit')).toBe('3');
	});
	test('rejects a Max Records out of range before any request', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(run(findRecords)({ tableId: 't1', searchField: 'title', searchValue: 'A', maxRecords: 0 })).rejects.toThrow(/Max Records/);
		expect(seen).toHaveLength(0);
	});
});

describe('record writes', () => {
	test('create_record formats select and returns label keys', async () => {
		const seen = stubFetch((request: SeenRequest) => (request.method === 'POST' ? { status: 201, body: { id: 'r1', title: 'A', s_sel: 'new' } } : { body: TABLE }));
		await expect(run(createRecord)({ tableId: 't1', fields: { title: 'A', s_sel: 'new' } })).resolves.toEqual({ id: 'r1', Title: 'A', Stage: 'new' });
		expect(seen[1].path).toBe('/applications/t1/records/');
		expect(seen[1].body).toEqual({ title: 'A', s_sel: 'new' });
	});
	test('delete_record treats 404 as already deleted', async () => {
		stubFetch(() => ({ status: 404, body: { detail: 'Not found.' } }));
		await expect(run(deleteRecord)({ tableId: 't1', recordId: 'r1' })).resolves.toEqual({ id: 'r1', deleted: true, alreadyDeleted: true });
	});
	test('delete_record rethrows 403', async () => {
		stubFetch(() => ({ status: 403, body: { detail: 'nope' } }));
		await expect(run(deleteRecord)({ tableId: 't1', recordId: 'r1' })).rejects.toMatchObject({ status: 403 });
	});
	test('record IDs are path-encoded', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await run(deleteRecord)({ tableId: 't1', recordId: '../solutions' });
		expect(seen[0].url).toContain('/records/..%2Fsolutions/');
	});
	test('update_record_fields sends exactly the given slugs, nulls included', async () => {
		const seen = stubFetch(() => ({ body: { id: 'r1' } }));
		await run(updateRecordFieldsAi)({ tableId: 't1', recordId: 'r1', fields: { s_sel: null, title: '' } });
		expect(seen[0].method).toBe('PATCH');
		expect(seen[0].body).toEqual({ s_sel: null, title: '' });
	});
	test('update_record_fields refuses an empty object', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(run(updateRecordFieldsAi)({ tableId: 't1', recordId: 'r1', fields: {} })).rejects.toThrow(/at least one/);
		expect(seen).toHaveLength(0);
	});
	test('create_record_by_id parses JSON strings and rejects arrays', async () => {
		const seen = stubFetch(() => ({ status: 201, body: { id: 'r1' } }));
		await run(createRecordByIdAi)({ tableId: 't1', fields: '{"title":"A"}' });
		expect(seen[0].body).toEqual({ title: 'A' });
		await expect(run(createRecordByIdAi)({ tableId: 't1', fields: [] })).rejects.toThrow(/JSON object/);
	});
});

describe('upsert_record', () => {
	test('updates the single match', async () => {
		const seen = stubFetch((request: SeenRequest) => (request.path.endsWith('/records/list/') ? { body: { items: [{ id: 'r1' }], total: 1 } } : { body: { id: 'r1' } }));
		await expect(run(upsertRecordById)({ tableId: 't1', matchField: 'title', matchValue: 'A', fields: { s_sel: 'new' } })).resolves.toMatchObject({ action: 'updated' });
		expect(seen[1]).toMatchObject({ method: 'PATCH', path: '/applications/t1/records/r1/', body: { s_sel: 'new' } });
	});
	test('creates with the match value when none match', async () => {
		const seen = stubFetch((request: SeenRequest) => (request.path.endsWith('/records/list/') ? { body: { items: [], total: 0 } } : { status: 201, body: { id: 'r2' } }));
		await expect(run(upsertRecordById)({ tableId: 't1', matchField: 'title', matchValue: 'A', fields: { s_sel: 'new' } })).resolves.toMatchObject({ action: 'created' });
		expect(seen[1]).toMatchObject({ method: 'POST', body: { title: 'A', s_sel: 'new' } });
	});
	test('refuses to change anything when more than one record matches', async () => {
		const seen = stubFetch(() => ({ body: { items: [{ id: 'a' }, { id: 'b' }], total: 2 } }));
		await expect(run(upsertRecordById)({ tableId: 't1', matchField: 'title', matchValue: 'A', fields: {} })).rejects.toThrow(/More than one/);
		expect(seen).toHaveLength(1);
	});
});

describe('bulk', () => {
	test('bulk create wraps items and enforces the 25 cap', async () => {
		const seen = stubFetch(() => ({ status: 201, body: [{ id: 'a' }, { id: 'b' }] }));
		await expect(run(bulkCreateRecords)({ tableId: 't1', records: [{ title: 'a' }, { title: 'b' }] })).resolves.toMatchObject({ count: 2 });
		expect(seen[0]).toMatchObject({ method: 'POST', path: '/applications/t1/records/bulk/', body: { items: [{ title: 'a' }, { title: 'b' }] } });
		await expect(run(bulkCreateRecords)({ tableId: 't1', records: Array.from({ length: 26 }, () => ({})) })).rejects.toThrow(/at most 25/);
	});
	test('bulk update needs an id per item', async () => {
		stubFetch(() => ({ body: [] }));
		await expect(run(bulkUpdateRecords)({ tableId: 't1', records: [{ title: 'x' }] })).rejects.toThrow(/needs an "id"/);
	});
	test('bulk delete refuses an empty list and dedupes IDs', async () => {
		const seen = stubFetch(() => ({ body: [{ id: 'a' }] }));
		await expect(run(bulkDeleteRecords)({ tableId: 't1', recordIds: [] })).rejects.toThrow(/at least one/);
		await expect(run(bulkDeleteRecords)({ tableId: 't1', recordIds: ['a', 'a', ' '] })).resolves.toEqual({ deletedIds: ['a'], count: 1 });
		expect(seen[0]).toMatchObject({ method: 'PATCH', path: '/applications/t1/records/bulk_delete/', body: { items: ['a'] } });
	});
});

describe('schema and workspace', () => {
	test('list_solutions hides hidden solutions by default', async () => {
		stubFetch(() => ({ body: [{ id: 'a', hidden: true }, { id: 'b', hidden: false }] }));
		await expect(run(listSolutions)({})).resolves.toEqual({ items: [{ id: 'b', hidden: false }], count: 1 });
	});
	test('get_table_schema returns slugs, system flag and choice values', async () => {
		stubFetch(() => ({ body: TABLE }));
		const result = await run(getTableSchema)({ tableId: 't1' });
		expect(result).toMatchObject({ fields: [{ slug: 'title' }, { slug: 's_sel', choices: [{ label: 'New', value: 'new' }] }, { slug: 'first_created', system: true }] });
	});
	test('add_comment builds a doc message without mentions', async () => {
		const seen = stubFetch(() => ({ status: 201, body: { id: 'c1' } }));
		await run(addCommentById)({ tableId: 't1', recordId: 'r1', message: 'hi\nthere' });
		expect(seen[0].body).toEqual({
			application: 't1',
			record: 'r1',
			assigned_to: null,
			message: { data: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }, { type: 'paragraph', content: [{ type: 'text', text: 'there' }] }] } },
		});
	});
	test('add_field posts the field and returns it from the refreshed schema', async () => {
		const seen = stubFetch((request: SeenRequest) =>
			request.method === 'POST' ? { body: null } : { body: { ...TABLE, structure: [...TABLE.structure, { slug: 'amount', label: 'Amount', field_type: 'numberfield', params: {} }] } },
		);
		await expect(run(addField)({ tableId: 't1', label: 'Amount', fieldType: 'numberfield', slug: 'amount' })).resolves.toMatchObject({ field: { slug: 'amount', field_type: 'numberfield' } });
		expect(seen[0]).toMatchObject({ path: '/applications/t1/add_field/', body: { field: { slug: 'amount', label: 'Amount', field_type: 'numberfield', params: {} } } });
	});
	test('add_field validates select choices and slug', async () => {
		stubFetch(() => ({ body: {} }));
		await expect(run(addField)({ tableId: 't1', label: 'S', fieldType: 'singleselectfield' })).rejects.toThrow(/at least one choice/);
		await expect(run(addField)({ tableId: 't1', label: 'S', fieldType: 'textfield', slug: 'Bad Slug' })).rejects.toThrow(/Field Slug/);
	});
	test('get file url reads url from the response', async () => {
		const seen = stubFetch(() => ({ body: { url: 'https://files.smartsuite.com/x' } }));
		await expect(run(getFileUrlByHandle)({ fileHandle: 'h1' })).resolves.toEqual({ handle: 'h1', url: 'https://files.smartsuite.com/x' });
		expect(seen[0].path).toBe('/shared-files/h1/url/');
	});
	test('list_members pages with total', async () => {
		const seen = stubFetch(() => ({ body: { items: [{ id: 'm1' }], total: 3 } }));
		await expect(run(listMembers)({ limit: 1, offset: 1 })).resolves.toEqual({ items: [{ id: 'm1' }], total: 3, offset: 1, limit: 1, hasMore: true });
		expect(seen[0].query.get('offset')).toBe('1');
	});
	test('list_records validates filter and sort', async () => {
		stubFetch(() => ({ body: { items: [], total: 0 } }));
		await expect(run(listRecordsAi)({ tableId: 't1', filter: [1] })).rejects.toThrow(/Filter/);
		await expect(run(listRecordsAi)({ tableId: 't1', sort: { a: 1 } })).rejects.toThrow(/Sort/);
		await expect(run(listRecordsAi)({ tableId: 't1', limit: 5000 })).rejects.toThrow(/Limit/);
	});
});

describe('ai twins', () => {
	test('delete_record_by_id 404 = already deleted, path encoded', async () => {
		const seen = stubFetch(() => ({ status: 404, body: { detail: 'Not found.' } }));
		await expect(run(deleteRecordByIdAi)({ tableId: 't 1', recordId: 'r1' })).resolves.toEqual({ id: 'r1', deleted: true, alreadyDeleted: true });
		expect(seen[0]).toMatchObject({ method: 'DELETE', path: '/applications/t%201/records/r1/' });
	});
	test('attach_file_by_id uploads multipart to the field and returns the field files', async () => {
		const seen = stubFetch((request: SeenRequest) => (request.method === 'POST' ? { body: null } : { body: { id: 'r1', s_file: [{ handle: 'h1' }] } }));
		await expect(
			run(attachFileByIdAi)({ tableId: 't1', recordId: 'r1', fieldSlug: 's_file', file: { base64: Buffer.from('hi').toString('base64'), filename: 'a.txt' } }),
		).resolves.toEqual({ recordId: 'r1', field: 's_file', fileName: 'a.txt', files: [{ handle: 'h1' }] });
		expect(seen[0].path).toBe('/recordfiles/t1/r1/s_file/');
	});
	test('attach_file_by_id refuses an empty file before any request', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(run(attachFileByIdAi)({ tableId: 't1', recordId: 'r1', fieldSlug: 's_file', file: { base64: '', filename: 'a.txt' } })).rejects.toThrow(/empty/);
		expect(seen).toHaveLength(0);
	});
});

describe('human twins share the helper', () => {
	test('upsert_record formats builder fields with the table schema', async () => {
		const seen = stubFetch((request: SeenRequest) => {
			if (request.path.endsWith('/records/list/')) return { body: { items: [], total: 0 } };
			if (request.method === 'POST') return { status: 201, body: { id: 'r9' } };
			return { body: TABLE };
		});
		await expect(run(upsertRecord)({ solutionId: 's1', tableId: 't1', matchField: 'title', matchValue: 'A', fields: { s_sel: 'new', first_created: '' } })).resolves.toEqual({ action: 'created', record: { id: 'r9' } });
		expect(seen[2]).toMatchObject({ method: 'POST', path: '/applications/t1/records/', body: { title: 'A', s_sel: 'new' } });
	});
	test('upsert_record formats the match value for the field type when it creates', async () => {
		const emailTable = { ...TABLE, structure: [...TABLE.structure, { slug: 's_email', label: 'Email', field_type: 'emailfield', params: {} }] };
		const seen = stubFetch((request: SeenRequest) => {
			if (request.path.endsWith('/records/list/')) return { body: { items: [], total: 0 } };
			if (request.method === 'POST') return { status: 201, body: { id: 'r9' } };
			return { body: emailTable };
		});
		await run(upsertRecord)({ solutionId: 's1', tableId: 't1', matchField: 's_email', matchValue: 'a@b.co', fields: {} });
		expect(seen[1].body).toMatchObject({ filter: { fields: [{ field: 's_email', comparison: 'is', value: 'a@b.co' }] } });
		expect(seen[2].body).toEqual({ s_email: ['a@b.co'] });
	});
	test('add_comment sends the picked member as assignee', async () => {
		const seen = stubFetch(() => ({ status: 201, body: { id: 'c1' } }));
		await run(addComment)({ solutionId: 's1', tableId: 't1', recordId: 'r1', message: 'hi', assignedTo: 'm1' });
		expect(seen[0].body).toMatchObject({ application: 't1', record: 'r1', assigned_to: 'm1' });
	});
	test('download_record_file returns a URL per file in the picked field', async () => {
		const seen = stubFetch((request: SeenRequest) =>
			request.path.startsWith('/shared-files/')
				? { body: { url: `https://files.smartsuite.com/${request.path.split('/')[2]}` } }
				: { body: { id: 'r1', s_file: [{ handle: 'h1', metadata: { filename: 'a.txt' } }, { handle: 'h2' }] } },
		);
		await expect(run(getFileUrl)({ solutionId: 's1', tableId: 't1', recordId: 'r1', field: 's_file' })).resolves.toEqual({
			recordId: 'r1',
			field: 's_file',
			files: [
				{ handle: 'h1', name: 'a.txt', url: 'https://files.smartsuite.com/h1' },
				{ handle: 'h2', name: null, url: 'https://files.smartsuite.com/h2' },
			],
			count: 2,
		});
		expect(seen[0].path).toBe('/applications/t1/records/r1/');
	});
});

describe('list limits', () => {
	test('a list longer than the page cap fails instead of returning a partial list', async () => {
		stubFetch((request: SeenRequest) => ({ body: { results: [{ id: request.query.get('offset') }], next: 'more' } }));
		await expect(run(listSolutions)({})).rejects.toThrow(/more than 5000 items/);
	});
});

describe('piece metadata', () => {
	test('record schemas expose every table field through a dynamic map', () => {
		for (const name of ['create_record', 'get_record_by_id']) {
			const action = Object.values(smartsuite.actions()).find((a) => a.name === name);
			expect(action?.outputSchema?.fields, name).toContainEqual(expect.objectContaining({ value: '', dynamicKey: true }));
		}
	});

	test('every action has outputSchema, aiMetadata and classification', () => {
		const actions = Object.values(smartsuite.actions()).filter((a) => a.name !== 'custom_api_call');
		expect(actions).toHaveLength(45);
		for (const action of actions) {
			expect(action.outputSchema, action.name).toBeDefined();
			expect(action.aiMetadata?.description, action.name).toBeTruthy();
			expect(action.classification, action.name).toBeTruthy();
		}
		for (const action of actions.filter((a) => a.audience !== 'human')) {
			for (const [key, prop] of Object.entries(action.props)) {
				expect(['DROPDOWN', 'DYNAMIC', 'MULTI_SELECT_DROPDOWN'], `${action.name}.${key}`).not.toContain(prop.type);
			}
		}
		const human = actions.filter((a) => a.audience === 'human');
		const ai = actions.filter((a) => a.audience === 'ai');
		expect(actions.filter((a) => a.audience === 'both').map((a) => a.name).sort()).toEqual(['list_members', 'list_solutions', 'list_teams']);
		expect(ai.map((a) => a.name).sort()).toEqual(AI_ACTIONS);
		expect(human.map((a) => a.name).sort()).toEqual(HUMAN_ACTIONS);
		for (const action of human) {
			const pickers = Object.entries(action.props).filter(([key]) => ['solutionId', 'tableId', 'memberId'].includes(key));
			expect(pickers.length, action.name).toBeGreaterThan(0);
			for (const [key, prop] of pickers) {
				expect(prop.type, `${action.name}.${key}`).toBe('DROPDOWN');
			}
		}
		for (const action of ai) {
			expect(action.aiMetadata?.description, action.name).toMatch(/\(by (ID|Table ID|Handle)\)|\(Bulk, by ID\)|List Records|List Solutions|List Members|Update Record Fields/);
		}
	});
});

const AI_ACTIONS = [
	'add_comment_by_id',
	'add_field_by_id',
	'attach_file_by_id',
	'bulk_create_records_by_id',
	'bulk_delete_records_by_id',
	'bulk_update_records_by_id',
	'create_record_by_id',
	'create_table_by_id',
	'delete_record_by_id',
	'download_record_file_by_handle',
	'get_member_by_id',
	'get_record_by_id',
	'get_solution_by_id',
	'get_table_schema_by_id',
	'list_comments_by_id',
	'list_deleted_records_by_id',
	'list_records',
	'list_tables_by_id',
	'restore_record_by_id',
	'update_record_fields',
	'upsert_record_by_id',
];

const HUMAN_ACTIONS = AI_ACTIONS.map((name) =>
	({ attach_file_by_id: 'upload_file', list_records: 'find_records', update_record_fields: 'update_record', download_record_file_by_handle: 'download_record_file' })[name] ?? name.replace(/_by_id$/, ''),
).sort();
