import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { listPagesAction } from '../src/lib/actions/list-pages';
import { getPageAction } from '../src/lib/actions/get-page';
import { createPageAction } from '../src/lib/actions/create-page';
import { updatePageAction } from '../src/lib/actions/update-page';
import { deletePageAction } from '../src/lib/actions/delete-page';
import { getPageContentAction } from '../src/lib/actions/get-page-content';
import { pageExport } from '../src/lib/common/page-export';
import { run, stubFetch, TOKEN } from './helpers';

const S3 = 'https://bucket.s3.amazonaws.com/export/1?sig=abc';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('list_pages / get_page', () => {
	test('list pages with paging', async () => {
		const seen = stubFetch(() => ({ body: { items: [{ id: 'canvas-1' }] } }));
		await expect(run(listPagesAction)({ docId: 'd', limit: 5 })).resolves.toEqual({ items: [{ id: 'canvas-1' }], nextPageToken: null, hasMore: false });
		expect(seen[0].path).toBe('/docs/d/pages');
		expect(seen[0].query.get('limit')).toBe('5');
	});
	test('get page by name is encoded', async () => {
		const seen = stubFetch(() => ({ body: { id: 'canvas-1' } }));
		await run(getPageAction)({ docId: 'd', pageIdOrName: 'My Page' });
		expect(seen[0].url).toContain('/docs/d/pages/My%20Page');
	});
});

describe('create_page', () => {
	test('posts canvas content and waits', async () => {
		const seen = stubFetch((request) =>
			request.path.startsWith('/mutationStatus') ? { body: { completed: true } } : { status: 202, body: { id: 'canvas-9', requestId: 'mutate:p' } },
		);
		const result = await run(createPageAction)({ docId: 'd', name: 'P', parentPageId: 'canvas-1', content: '# x', contentFormat: 'markdown' });
		expect(seen[0].body).toEqual({
			name: 'P',
			parentPageId: 'canvas-1',
			pageContent: { type: 'canvas', canvasContent: { format: 'markdown', content: '# x' } },
		});
		expect(result).toEqual({ id: 'canvas-9', requestId: 'mutate:p', completed: true, warning: null });
	});
});

describe('update_page', () => {
	test('replace content and hide', async () => {
		const seen = stubFetch((request) =>
			request.path.startsWith('/mutationStatus') ? { body: { completed: true } } : { status: 202, body: { id: 'canvas-1', requestId: 'mutate:u' } },
		);
		await run(updatePageAction)({ docId: 'd', pageIdOrName: 'canvas-1', content: 'new', insertionMode: 'replace', visibility: 'hidden' });
		expect(seen[0].method).toBe('PUT');
		expect(seen[0].body).toEqual({
			isHidden: true,
			contentUpdate: { insertionMode: 'replace', canvasContent: { format: 'markdown', content: 'new' } },
		});
	});
	test('defaults to append', async () => {
		const seen = stubFetch(() => ({ status: 202, body: { id: 'canvas-1', requestId: 'mutate:u' } }));
		await run(updatePageAction)({ docId: 'd', pageIdOrName: 'canvas-1', content: 'more', waitForCompletion: false });
		expect(seen[0].body).toMatchObject({ contentUpdate: { insertionMode: 'append' } });
	});
	test('refuses an empty update', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(run(updatePageAction)({ docId: 'd', pageIdOrName: 'canvas-1', content: '  ' })).rejects.toThrow(/Nothing to update/);
		expect(seen).toHaveLength(0);
	});
});

describe('delete_page', () => {
	test.each([404, 410])('%s means already deleted', async (status) => {
		stubFetch(() => ({ status, body: { message: 'gone' } }));
		await expect(run(deletePageAction)({ docId: 'd', pageIdOrName: 'canvas-1' })).resolves.toMatchObject({ alreadyDeleted: true, completed: true });
	});
	test('deletes and waits', async () => {
		const seen = stubFetch((request) =>
			request.path.startsWith('/mutationStatus') ? { body: { completed: true } } : { status: 202, body: { id: 'canvas-1', requestId: 'mutate:d' } },
		);
		await expect(run(deletePageAction)({ docId: 'd', pageIdOrName: 'canvas-1' })).resolves.toMatchObject({ id: 'canvas-1', alreadyDeleted: false, completed: true });
		expect(seen[0].method).toBe('DELETE');
	});
});

describe('get_page_content', () => {
	test('exports, polls, then downloads without the Coda token', async () => {
		const seen = stubFetch((request) => {
			if (request.method === 'POST') {
				return { status: 202, body: { id: 'exp1', status: 'inProgress' } };
			}
			if (request.url.startsWith(S3)) {
				return { text: '# Hello' };
			}
			return { body: { id: 'exp1', status: seen.length < 4 ? 'inProgress' : 'complete', downloadLink: S3 } };
		});
		const result = await run(getPageContentAction)({ docId: 'd', pageIdOrName: 'canvas-1', outputFormat: 'markdown' });
		expect(result).toEqual({ pageId: 'canvas-1', format: 'markdown', completed: true, exportId: 'exp1', content: '# Hello', truncated: false });
		expect(seen[0].body).toEqual({ outputFormat: 'markdown' });
		const download = seen.find((request) => request.url.startsWith(S3));
		expect(download?.auth).toBeNull();
		expect(download?.accept).toContain('text/markdown');
		expect(seen.filter((request) => request.url.startsWith('https://coda.io')).every((request) => request.auth === `Bearer ${TOKEN}`)).toBe(true);
	});
	test('resumes with an export id and returns completed false when still running', async () => {
		const seen = stubFetch(() => ({ body: { id: 'exp1', status: 'inProgress' } }));
		const result = await run(getPageContentAction)({ docId: 'd', pageIdOrName: 'canvas-1', outputFormat: 'html', exportId: 'exp1' });
		expect(result).toEqual({ pageId: 'canvas-1', format: 'html', completed: false, exportId: 'exp1', content: null, truncated: false });
		expect(seen.every((request) => request.method === 'GET')).toBe(true);
	});
	test('a hanging or failing status check returns the export id to resume instead of failing', async () => {
		stubFetch(() => ({ status: 503 }));
		await expect(run(getPageContentAction)({ docId: 'd', pageIdOrName: 'p', outputFormat: 'markdown', exportId: 'exp1' })).resolves.toEqual({
			pageId: 'p',
			format: 'markdown',
			completed: false,
			exportId: 'exp1',
			content: null,
			truncated: false,
		});
		vi.stubGlobal(
			'fetch',
			vi.fn(
				(_input: unknown, init?: RequestInit) =>
					new Promise<Response>((_resolve, reject) => {
						init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
					}),
			),
		);
		const start = Date.now();
		const result = await run(getPageContentAction)({ docId: 'd', pageIdOrName: 'p', outputFormat: 'markdown', exportId: 'exp1' });
		expect(result).toMatchObject({ completed: false, exportId: 'exp1' });
		expect(Date.now() - start).toBeLessThanOrEqual(60_000);
	});
	test('an unknown export id fails instead of waiting', async () => {
		stubFetch(() => ({ status: 404, body: { message: 'no such export' } }));
		await expect(run(getPageContentAction)({ docId: 'd', pageIdOrName: 'p', outputFormat: 'markdown', exportId: 'nope' })).rejects.toThrow(/no such export/);
	});
	test('failed export throws', async () => {
		stubFetch((request) => (request.method === 'POST' ? { status: 202, body: { id: 'e' } } : { body: { id: 'e', status: 'failed', error: 'too big' } }));
		await expect(run(getPageContentAction)({ docId: 'd', pageIdOrName: 'p', outputFormat: 'markdown' })).rejects.toThrow(/too big/);
	});
	test('refuses a non-https download link', async () => {
		await expect(pageExport.downloadText({ url: 'http://bucket/x', format: 'markdown' })).rejects.toThrow(/not HTTPS/);
	});
	test('caps content at the byte limit', async () => {
		const stream = Readable.from([Buffer.from('abcdef'), Buffer.from('ghij')]);
		await expect(pageExport.readCapped({ stream, maxBytes: 8, timeoutMs: 1000 })).resolves.toEqual({ content: 'abcdefgh', truncated: true });
	});
	test('exact-size content is not truncated', async () => {
		const stream = Readable.from([Buffer.from('abcd')]);
		await expect(pageExport.readCapped({ stream, maxBytes: 4, timeoutMs: 1000 })).resolves.toEqual({ content: 'abcd', truncated: false });
	});
});
