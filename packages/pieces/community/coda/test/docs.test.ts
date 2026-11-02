import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getCurrentUserAction } from '../src/lib/actions/get-current-user';
import { listDocsAction } from '../src/lib/actions/list-docs';
import { getDocAction } from '../src/lib/actions/get-doc';
import { createDocAction } from '../src/lib/actions/create-doc';
import { updateDocAction } from '../src/lib/actions/ai/update-doc';
import { deleteDocAction } from '../src/lib/actions/delete-doc';
import { listFoldersAction } from '../src/lib/actions/list-folders';
import { replies, run, stubFetch } from './helpers';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('get_current_user', () => {
	test('GET /whoami', async () => {
		const seen = stubFetch(() => ({ body: { name: 'A', loginId: 'a@b.c' } }));
		await expect(run(getCurrentUserAction)({})).resolves.toEqual({ name: 'A', loginId: 'a@b.c' });
		expect(seen[0].path).toBe('/whoami');
	});
});

describe('list_docs', () => {
	test('sends only set filters and returns one page', async () => {
		const seen = stubFetch(() => ({ body: { items: [{ id: 'd1' }], nextPageToken: 'n', nextPageLink: 'https://evil.io/x' } }));
		const result = await run(listDocsAction)({ query: ' plan ', isOwner: true, isStarred: false, limit: 10, pageToken: 'p' });
		expect(result).toEqual({ items: [{ id: 'd1' }], nextPageToken: 'n', hasMore: true });
		expect(Object.fromEntries(seen[0].query)).toEqual({ query: 'plan', isOwner: 'true', limit: '10', pageToken: 'p' });
		expect(seen).toHaveLength(1);
	});
	test('rejects limit above 100', async () => {
		await expect(run(listDocsAction)({ limit: 101 })).rejects.toThrow(/between 1 and 100/);
	});
});

describe('get_doc', () => {
	test('accepts a browser link', async () => {
		const seen = stubFetch(() => ({ body: { id: 'MG3' } }));
		await run(getDocAction)({ docId: 'https://docs.superhuman.com/d/AP-TEST_dMG3' });
		expect(seen[0].path).toBe('/docs/MG3');
	});
	test('refuses a lookalike host before any request', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(run(getDocAction)({ docId: 'https://coda.io.evil.io/d/_dMG3' })).rejects.toThrow(/not a Coda doc link/);
		expect(seen).toHaveLength(0);
	});
});

describe('create_doc', () => {
	test('copies a doc and waits for the copy', async () => {
		const seen = stubFetch(
			replies([
				{ status: 201, body: { id: 'new1', name: 'T', requestId: 'copy_doc:src:new1' } },
				{ body: { completed: true } },
			]),
		);
		const result = await run(createDocAction)({ title: ' T ', sourceDoc: 'https://coda.io/d/X_dsrc', folderId: 'fl-1' });
		expect(seen[0].body).toEqual({ title: 'T', sourceDoc: 'src', folderId: 'fl-1' });
		expect(seen[1].path).toBe('/mutationStatus/copy_doc%3Asrc%3Anew1');
		expect(result).toMatchObject({ id: 'new1', requestId: 'copy_doc:src:new1', completed: true, warning: null });
	});
	test('blank doc with a first page', async () => {
		const seen = stubFetch(replies([{ status: 201, body: { id: 'n', requestId: 'create_doc:n' } }, { body: { completed: true } }]));
		await run(createDocAction)({ title: 'T', pageName: 'Intro', pageContent: '# Hi', contentFormat: 'markdown' });
		expect(seen[0].body).toEqual({
			title: 'T',
			initialPage: { name: 'Intro', pageContent: { type: 'canvas', canvasContent: { format: 'markdown', content: '# Hi' } } },
		});
	});
	test('refuses page content together with a copy', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(run(createDocAction)({ title: 'T', sourceDoc: 'src', pageContent: 'x' })).rejects.toThrow(/blank doc/);
		expect(seen).toHaveLength(0);
	});
	test('no wait when turned off', async () => {
		const seen = stubFetch(() => ({ status: 201, body: { id: 'n', requestId: 'create_doc:n' } }));
		const result = await run(createDocAction)({ title: 'T', waitForCompletion: false });
		expect(seen).toHaveLength(1);
		expect(result).toMatchObject({ completed: false, requestId: 'create_doc:n' });
	});
});

describe('update_doc', () => {
	test('is ai-only and PATCHes only given fields', async () => {
		expect(updateDocAction.audience).toBe('ai');
		const seen = stubFetch(() => ({ body: {} }));
		const result = await run(updateDocAction)({ docId: 'd1', title: ' New ' });
		expect(seen[0].method).toBe('PATCH');
		expect(seen[0].body).toEqual({ title: 'New' });
		expect(result).toEqual({ id: 'd1', title: 'New', iconName: null });
	});
	test('refuses an empty update', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(run(updateDocAction)({ docId: 'd1', title: ' ' })).rejects.toThrow(/Title or an Icon Name/);
		expect(seen).toHaveLength(0);
	});
});

describe('delete_doc', () => {
	test('DELETE and report', async () => {
		const seen = stubFetch(() => ({ status: 202, body: {} }));
		await expect(run(deleteDocAction)({ docId: 'd1' })).resolves.toEqual({ id: 'd1', deleted: true, alreadyDeleted: false });
		expect(seen[0].method).toBe('DELETE');
	});
	test('404 means already deleted', async () => {
		stubFetch(() => ({ status: 404, body: { message: 'gone' } }));
		await expect(run(deleteDocAction)({ docId: 'd1' })).resolves.toEqual({ id: 'd1', deleted: true, alreadyDeleted: true });
	});
	test('other failures fail', async () => {
		stubFetch(() => ({ status: 403, body: { message: 'nope' } }));
		await expect(run(deleteDocAction)({ docId: 'd1' })).rejects.toThrow(/403/);
	});
});

describe('list_folders', () => {
	test('filters by workspace', async () => {
		const seen = stubFetch(() => ({ body: { items: [] } }));
		await expect(run(listFoldersAction)({ workspaceId: 'ws-1' })).resolves.toEqual({ items: [], nextPageToken: null, hasMore: false });
		expect(seen[0].path).toBe('/folders');
		expect(seen[0].query.get('workspaceId')).toBe('ws-1');
	});
});
