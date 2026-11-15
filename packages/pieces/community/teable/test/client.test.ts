import { beforeEach, describe, expect, it, vi } from 'vitest';
import { teableClient, TeableRecord } from '../src/lib/common/client';
import { PAT_AUTH, patAuthWithBaseUrl } from './helpers';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
	return {
		...actual,
		httpClient: {
			sendRequest: (...args: unknown[]) => sendRequest(...args),
		},
	};
});

function makeRecords({ count, offset }: { count: number; offset: number }): TeableRecord[] {
	return Array.from({ length: count }, (_, i) => ({
		id: `rec${offset + i}`,
		fields: { Name: `row ${offset + i}` },
	}));
}

function requestUrls(): string[] {
	return sendRequest.mock.calls.map((c) => c[0].url);
}

beforeEach(() => {
	sendRequest.mockReset();
});

describe('buildQueryString', () => {
	it('skips empty values and repeats array params with bracket keys', () => {
		const query = teableClient.buildQueryString({
			take: 10,
			skip: 0,
			filter: undefined,
			search: '',
			viewId: null,
			selectedRecordIds: ['a', 'b'],
			empty: [],
		});
		expect(query).toBe('?take=10&skip=0&selectedRecordIds%5B%5D=a&selectedRecordIds%5B%5D=b');
	});

	it('returns an empty string when nothing is set', () => {
		expect(teableClient.buildQueryString({})).toBe('');
		expect(teableClient.buildQueryString(undefined)).toBe('');
	});
});

describe('request URLs stay on the connection host', () => {
	it('targets the normalized self-hosted origin', async () => {
		sendRequest.mockResolvedValueOnce({ body: [] });
		await teableClient.listBases({ auth: patAuthWithBaseUrl('https://teable.example.com/') });
		expect(requestUrls()).toEqual(['https://teable.example.com/api/base/access/all']);
	});

	it('URL-encodes path segments', async () => {
		sendRequest.mockResolvedValueOnce({ body: { records: [] } });
		await teableClient.listRecords({ auth: PAT_AUTH, tableId: 'tbl/..' });
		expect(requestUrls()[0]).toBe('https://app.teable.ai/api/table/tbl%2F../record');
	});
});

describe('listRecordsPaged', () => {
	it('pages until the cap and reports hasMore from a lookahead', async () => {
		sendRequest.mockResolvedValueOnce({ body: { records: makeRecords({ count: 1000, offset: 0 }) } });
		sendRequest.mockResolvedValueOnce({ body: { records: makeRecords({ count: 500, offset: 1000 }) } });
		sendRequest.mockResolvedValueOnce({ body: { records: makeRecords({ count: 1, offset: 1500 }) } });
		const result = await teableClient.listRecordsPaged({
			auth: PAT_AUTH,
			tableId: 'tbl1',
			maxRecords: 1500,
		});
		expect(result.records).toHaveLength(1500);
		expect(result.hasMore).toBe(true);
		expect(requestUrls()[0]).toContain('take=1000');
		expect(requestUrls()[0]).toContain('skip=0');
		expect(requestUrls()[1]).toContain('take=500');
		expect(requestUrls()[1]).toContain('skip=1000');
		expect(requestUrls()[2]).toContain('take=1');
	});

	it('stops early when a page comes back short', async () => {
		sendRequest.mockResolvedValueOnce({ body: { records: makeRecords({ count: 42, offset: 0 }) } });
		const result = await teableClient.listRecordsPaged({
			auth: PAT_AUTH,
			tableId: 'tbl1',
			maxRecords: 500,
		});
		expect(result.records).toHaveLength(42);
		expect(result.hasMore).toBe(false);
		expect(sendRequest).toHaveBeenCalledTimes(1);
	});

	it('honors a skip offset', async () => {
		sendRequest.mockResolvedValueOnce({ body: { records: [] } });
		await teableClient.listRecordsPaged({
			auth: PAT_AUTH,
			tableId: 'tbl1',
			maxRecords: 10,
			skip: 30,
		});
		expect(requestUrls()[0]).toContain('skip=30');
	});
});

describe('deleteRecord', () => {
	it('maps a 404 to a clear error without leaking the token', async () => {
		const { HttpError } = await import('@activepieces/pieces-common');
		sendRequest.mockRejectedValueOnce(
			new HttpError({ secret: 'request' }, { status: 404, responseBody: { message: 'not found' } })
		);
		await expect(
			teableClient.deleteRecord({ auth: PAT_AUTH, tableId: 'tbl1', recordId: 'rec1' })
		).rejects.toThrow('Record rec1 was not found in table tbl1. It may already be deleted.');
		try {
			sendRequest.mockRejectedValueOnce(
				new HttpError({}, { status: 404, responseBody: {} })
			);
			await teableClient.deleteRecord({ auth: PAT_AUTH, tableId: 'tbl1', recordId: 'rec1' });
		} catch (e) {
			expect(e instanceof Error ? e.message : '').not.toContain('teable_test_token');
		}
	});

	it('rethrows other errors untouched', async () => {
		const { HttpError } = await import('@activepieces/pieces-common');
		sendRequest.mockRejectedValueOnce(new HttpError({}, { status: 500, responseBody: {} }));
		await expect(
			teableClient.deleteRecord({ auth: PAT_AUTH, tableId: 'tbl1', recordId: 'rec1' })
		).rejects.toBeInstanceOf(HttpError);
	});
});
