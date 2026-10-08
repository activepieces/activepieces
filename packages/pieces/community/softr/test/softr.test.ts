import { HttpError } from '@activepieces/pieces-common';
import { createMockPollingTriggerContext, InputPropertyMap } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SoftrAuth } from '../src/lib/common/auth';
import { softrSearch } from '../src/lib/common/search';
import { createAppUser } from '../src/lib/actions/create-app-user';
import { createDatabaseRecord } from '../src/lib/actions/create-database-record';
import { updateDatabaseRecord } from '../src/lib/actions/update-database-record';
import { findDatabaseRecord } from '../src/lib/actions/find-database-record';
import { findRecords } from '../src/lib/actions/find-records';
import { generateMagicLink } from '../src/lib/actions/generate-magic-link';
import { activateAppUser } from '../src/lib/actions/activate-app-user';
import { deactivateAppUser } from '../src/lib/actions/deactivate-app-user';
import { newDatabaseRecord } from '../src/lib/triggers/new-database-record';
import { authValidationServerContext, runAction, TEST_AUTH } from './helpers';

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

const TABLE = {
	id: 'tbl1',
	name: 'Contacts',
	fields: [
		{ id: 'f-name', name: 'Name', type: 'SINGLE_LINE_TEXT', readonly: false, allowMultipleEntries: false },
		{ id: 'f-age', name: 'Age', type: 'NUMBER', readonly: false, allowMultipleEntries: false },
		{ id: 'f-active', name: 'Active', type: 'CHECKBOX', readonly: false, allowMultipleEntries: false },
	],
};

function record({ id, createdAt }: { id: string; createdAt: string }) {
	return { id, tableId: 'tbl1', createdAt, updatedAt: createdAt, fields: { 'f-name': `N ${id}` } };
}

function httpError({ status, body, requestBody }: { status: number; body: unknown; requestBody: unknown }) {
	return new HttpError(requestBody, { status, responseBody: body });
}

beforeEach(() => {
	sendRequest.mockReset();
});

describe('error handling', () => {
	it('never puts the request body (password) in the error and surfaces the Softr message', async () => {
		sendRequest.mockRejectedValueOnce(
			httpError({
				status: 409,
				body: { message: 'User already exists', code: 'CONFLICT' },
				requestBody: { password: 'TopSecret-123' },
			}),
		);
		const result = runAction({
			action: createAppUser,
			propsValue: { email: 'a@b.co', full_name: 'A', password: 'TopSecret-123', domain: 'app.softr.app' },
		});
		await expect(result).rejects.toThrow('Softr API error (409 CONFLICT): User already exists.');
		const error = await result.catch((e: unknown) => e);
		expect(JSON.stringify(error)).not.toContain('TopSecret');
		expect(String(error)).not.toContain('TopSecret');
		expect(error instanceof Error ? error.stack : '').not.toContain('TopSecret');
	});

	it('validate() only reports invalid credentials on 401/403', async () => {
		sendRequest.mockRejectedValueOnce(httpError({ status: 401, body: { message: 'Unauthorized' }, requestBody: undefined }));
		const invalid = await SoftrAuth.validate?.({ auth: 'k', server: authValidationServerContext() });
		expect(invalid).toEqual({ valid: false, error: 'Invalid API key. Check the token in your Softr workspace settings.' });

		sendRequest.mockRejectedValueOnce(httpError({ status: 429, body: { message: 'Too many requests' }, requestBody: undefined }));
		const limited = await SoftrAuth.validate?.({ auth: 'k', server: authValidationServerContext() });
		expect(limited?.valid).toBe(false);
		expect(limited && 'error' in limited ? limited.error : '').toContain('Could not verify');
	});
});

describe('app users', () => {
	it('omits an empty password and strips the HTTP headers from the output', async () => {
		sendRequest.mockResolvedValueOnce({ status: 200, headers: { 'set-cookie': 'x' }, body: { email: 'a@b.co' } });
		const output = await runAction({
			action: createAppUser,
			propsValue: { email: ' a@b.co ', full_name: 'A', domain: 'https://app.softr.app/' },
		});
		const request = sendRequest.mock.calls[0][0];
		expect(request.url).toBe('https://studio-api.softr.io/v1/api/users');
		expect(request.headers['Softr-Domain']).toBe('app.softr.app');
		expect(request.body).toEqual({ email: 'a@b.co', full_name: 'A', generate_magic_link: false });
		expect(output).toEqual({ success: true, message: 'User created successfully', user: { status: 200, body: { email: 'a@b.co' } } });
	});

	it('returns the magic link when Softr answers with plain text', async () => {
		sendRequest.mockResolvedValueOnce({ status: 200, body: 'https://app.softr.app/?magic=abc' });
		const output = await runAction({ action: generateMagicLink, propsValue: { email: 'a+b@c.co', domain: 'app.softr.app' } });
		expect(sendRequest.mock.calls[0][0].url).toBe('https://studio-api.softr.io/v1/api/users/magic-link/generate/a%2Bb%40c.co');
		expect(output).toEqual({ email: 'a+b@c.co', magicLink: 'https://app.softr.app/?magic=abc' });
	});

	it('activates and deactivates a user by encoded email', async () => {
		sendRequest.mockResolvedValue({ status: 200, body: {} });
		const off = await runAction({ action: deactivateAppUser, propsValue: { email: ' a+b@c.co ', domain: 'app.softr.app' } });
		const on = await runAction({ action: activateAppUser, propsValue: { email: 'a+b@c.co', domain: 'app.softr.app' } });
		expect(sendRequest.mock.calls.map((c) => [c[0].method, c[0].url])).toEqual([
			['POST', 'https://studio-api.softr.io/v1/api/users/a%2Bb%40c.co/deactivate'],
			['POST', 'https://studio-api.softr.io/v1/api/users/a%2Bb%40c.co/activate'],
		]);
		expect(off).toEqual({ success: true, email: 'a+b@c.co', message: 'User deactivated' });
		expect(on).toEqual({ success: true, email: 'a+b@c.co', message: 'User activated' });
	});
});

describe('records', () => {
	it('creates a record with one table read before the write and maps field IDs to names', async () => {
		sendRequest
			.mockResolvedValueOnce({ body: { data: TABLE } })
			.mockResolvedValueOnce({ body: { data: { ...record({ id: 'r1', createdAt: '2026-01-01T00:00:00Z' }), fields: { 'f-name': 'Jane', 'f-age': 3 } } } });
		const output = await runAction({
			action: createDatabaseRecord,
			propsValue: { databaseId: 'db1', tableId: 'tbl1', fields: { 'f-name': 'Jane', 'f-age': 3, 'f-active': '' } },
		});
		expect(sendRequest.mock.calls[1][0].url).toBe('https://tables-api.softr.io/api/v1/databases/db1/tables/tbl1/records');
		expect(sendRequest.mock.calls[1][0].body).toEqual({ fields: { 'f-name': 'Jane', 'f-age': 3 } });
		expect(output).toMatchObject({ id: 'r1', fields: { Name: 'Jane', Age: 3 } });
	});

	it('refuses an update with no field values', async () => {
		await expect(
			runAction({ action: updateDatabaseRecord, propsValue: { databaseId: 'db1', tableId: 'tbl1', recordId: 'r1', fields: { 'f-name': '' } } }),
		).rejects.toThrow('at least one field');
		expect(sendRequest).not.toHaveBeenCalled();
	});

	it('Find Database Record sends numbers as numbers', async () => {
		sendRequest.mockResolvedValueOnce({ body: { data: TABLE } }).mockResolvedValueOnce({ body: { data: [], metadata: { total: 0 } } });
		const output = await runAction({
			action: findDatabaseRecord,
			propsValue: { databaseId: 'db1', tableId: 'tbl1', fieldId: 'f-age', fieldValue: '5' },
		});
		expect(sendRequest.mock.calls[1][0].body.filter.condition.conditions[0]).toEqual({ operator: 'IS', leftSide: 'f-age', rightSide: 5 });
		expect(output).toEqual({ found: false, data: {} });
	});

	it('Find Records builds conditions by field name, sorting and paging', async () => {
		sendRequest
			.mockResolvedValueOnce({ body: { data: TABLE } })
			.mockResolvedValueOnce({ body: { data: [record({ id: 'r1', createdAt: '2026-01-01T00:00:00Z' })], metadata: { offset: 0, limit: 1, total: 3 } } });
		const output = await runAction({
			action: findRecords,
			propsValue: {
				databaseId: 'db1',
				tableId: 'tbl1',
				conditions: [
					{ field: 'name', operator: 'CONTAINS', value: 'ja' },
					{ field: 'Age', operator: 'IS_BETWEEN', value: '1', upperBound: '9' },
					{ field: 'Active', operator: 'IS', value: 'TRUE' },
					{ field: 'Name', operator: 'IS_ONE_OF', value: 'a, b' },
					{ field: 'Name', operator: 'IS_EMPTY' },
				],
				matchType: 'OR',
				sortField: 'created_at',
				sortDirection: 'DESC',
				limit: 1,
				offset: 0,
			},
		});
		expect(sendRequest.mock.calls[1][0].body).toEqual({
			paging: { offset: 0, limit: 1 },
			filter: {
				condition: {
					operator: 'OR',
					conditions: [
						{ operator: 'CONTAINS', leftSide: 'f-name', rightSide: 'ja' },
						{ operator: 'IS_BETWEEN', leftSide: 'f-age', lowerBound: 1, upperBound: 9 },
						{ operator: 'IS', leftSide: 'f-active', rightSide: true },
						{ operator: 'IS_ONE_OF', leftSide: 'f-name', rightSide: ['a', 'b'] },
						{ operator: 'IS_EMPTY', leftSide: 'f-name' },
					],
				},
			},
			sorting: [{ sortingField: 'created_at', sortType: 'DESC' }],
		});
		expect(output).toMatchObject({ found: true, count: 1, total: 3, offset: 0, hasMore: true });
	});

	it('rejects a non-numeric value for a number field', () => {
		expect(() =>
			softrSearch.buildCondition({ field: TABLE.fields[1], operator: 'GREATER_THAN', value: 'abc' }),
		).toThrow('must be a number');
	});
});

describe('new record trigger', () => {
	const stamp = (i: number) => new Date(Date.UTC(2026, 0, 1) + i * 60000).toISOString();

	function mockTable({ total }: { total: number }) {
		sendRequest.mockImplementation(async (req: { url: string; body?: { paging: { offset: number; limit: number }; sorting: unknown } }) => {
			if (!req.url.endsWith('/records/search')) {
				return { body: { data: TABLE } };
			}
			const { offset, limit } = req.body?.paging ?? { offset: 0, limit: 10 };
			const newestFirst = Array.from({ length: total }, (_, k) => total - 1 - k);
			const data = newestFirst.slice(offset, offset + limit).map((i) => record({ id: `r${i}`, createdAt: stamp(i) }));
			return { body: { data, metadata: { offset, limit, total } } };
		});
	}

	function storeWith(initial: Record<string, unknown>) {
		const state = new Map(Object.entries(initial));
		return {
			get: async <T>(key: string): Promise<T | null> => {
				const value = state.get(key);
				return value === undefined ? null : JSON.parse(JSON.stringify(value));
			},
			put: async <T>(key: string, value: T): Promise<T> => {
				state.set(key, value);
				return value;
			},
			delete: async (key: string) => {
				state.delete(key);
			},
		};
	}

	async function runTriggerHook({ hook, context }: { hook: (context: never) => Promise<unknown>; context: unknown }): Promise<unknown[]> {
		const result: unknown = await Reflect.apply(hook, newDatabaseRecord, [context]);
		return Array.isArray(result) ? result : [];
	}

	function readId(item: unknown): string {
		return typeof item === 'object' && item !== null && 'id' in item ? String(item.id) : '';
	}

	function searchCalls() {
		return sendRequest.mock.calls.filter((c) => c[0].url.endsWith('/records/search'));
	}

	it('test mode asks Softr for the five newest records sorted by created_at', async () => {
		mockTable({ total: 1000 });
		const base = createMockPollingTriggerContext<InputPropertyMap>({ propsValue: { databaseId: 'db1', tableId: 'tbl1' } });
		const output = await runTriggerHook({ hook: newDatabaseRecord.test, context: { ...base, auth: TEST_AUTH, store: storeWith({}) } });
		expect(output.map(readId)).toEqual(['r999', 'r998', 'r997', 'r996', 'r995']);
		expect(searchCalls().length).toBe(1);
		expect(searchCalls()[0][0].body).toEqual({ paging: { offset: 0, limit: 5 }, sorting: [{ sortingField: 'created_at', sortType: 'DESC' }] });
	});

	it('a poll pages newest-first only until it passes the checkpoint, with no gaps or duplicates', async () => {
		mockTable({ total: 1000 });
		const base = createMockPollingTriggerContext<InputPropertyMap>({ propsValue: { databaseId: 'db1', tableId: 'tbl1' } });
		const checkpoint = new Date(stamp(850)).getTime();
		const output = await runTriggerHook({
			hook: newDatabaseRecord.run,
			context: { ...base, auth: TEST_AUTH, store: storeWith({ lastPoll: checkpoint }) },
		});
		const ids = output.map(readId);
		expect(ids.length).toBe(149);
		expect(new Set(ids).size).toBe(149);
		expect(ids[0]).toBe('r999');
		expect(ids[ids.length - 1]).toBe('r851');
		expect(searchCalls().length).toBe(2);
	});

	it('a poll with nothing new makes a single request', async () => {
		mockTable({ total: 50 });
		const base = createMockPollingTriggerContext<InputPropertyMap>({ propsValue: { databaseId: 'db1', tableId: 'tbl1' } });
		const output = await runTriggerHook({
			hook: newDatabaseRecord.run,
			context: { ...base, auth: TEST_AUTH, store: storeWith({ lastPoll: new Date(stamp(49)).getTime() }) },
		});
		expect(output).toEqual([]);
		expect(searchCalls().length).toBe(1);
	});
});
