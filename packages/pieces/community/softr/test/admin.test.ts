import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDatabase } from '../src/lib/actions/create-database';
import { updateDatabase } from '../src/lib/actions/update-database';
import { deleteDatabase } from '../src/lib/actions/delete-database';
import { createTable } from '../src/lib/actions/create-table';
import { updateTable } from '../src/lib/actions/update-table';
import { deleteTable } from '../src/lib/actions/delete-table';
import { createTableField } from '../src/lib/actions/create-table-field';
import { updateTableField } from '../src/lib/actions/update-table-field';
import { deleteTableField } from '../src/lib/actions/delete-table-field';
import { listTableViews } from '../src/lib/actions/list-table-views';
import { runAction } from './helpers';

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

const API = 'https://tables-api.softr.io/api/v1';

beforeEach(() => {
	sendRequest.mockReset();
	sendRequest.mockResolvedValue({ status: 200, body: { data: { id: 'x' } } });
});

function lastRequest() {
	return sendRequest.mock.calls[sendRequest.mock.calls.length - 1][0];
}

describe('databases', () => {
	it('creates a database with the workspace id', async () => {
		await runAction({ action: createDatabase, propsValue: { workspaceId: ' ws1 ', name: 'AP test', description: '' } });
		expect(lastRequest()).toMatchObject({ method: 'POST', url: `${API}/databases`, body: { workspaceId: 'ws1', name: 'AP test' } });
	});

	it('update sends only supplied values', async () => {
		await runAction({ action: updateDatabase, propsValue: { databaseId: 'db1', description: 'D' } });
		expect(lastRequest()).toMatchObject({ method: 'PUT', url: `${API}/databases/db1`, body: { description: 'D' } });
		await runAction({ action: updateDatabase, propsValue: { databaseId: 'db1', name: 'New' } });
		expect(lastRequest().body).toEqual({ name: 'New' });
	});

	it('update refuses an empty change', async () => {
		await expect(runAction({ action: updateDatabase, propsValue: { databaseId: 'db1' } })).rejects.toThrow('Provide a new name');
		expect(sendRequest).not.toHaveBeenCalled();
	});

	it('delete refuses an empty id and only forces when asked', async () => {
		await expect(runAction({ action: deleteDatabase, propsValue: { databaseId: ' ' } })).rejects.toThrow('Database ID is required');
		expect(sendRequest).not.toHaveBeenCalled();
		await runAction({ action: deleteDatabase, propsValue: { databaseId: 'db1' } });
		expect(lastRequest()).toMatchObject({ method: 'DELETE', url: `${API}/databases/db1`, queryParams: undefined });
		await runAction({ action: deleteDatabase, propsValue: { databaseId: 'db1', force: true } });
		expect(lastRequest().queryParams).toEqual({ force: 'true' });
	});
});

describe('tables and fields', () => {
	it('creates a table with typed fields and parsed options', async () => {
		await runAction({
			action: createTable,
			propsValue: {
				databaseId: 'db1',
				name: 'T',
				fields: [
					{ name: 'Status', type: 'SELECT', options: '{"choices":[{"label":"Open"}]}' },
					{ name: 'Qty', type: 'NUMBER' },
				],
			},
		});
		expect(lastRequest()).toMatchObject({
			method: 'POST',
			url: `${API}/databases/db1/tables`,
			body: {
				name: 'T',
				fields: [
					{ name: 'Status', type: 'SELECT', options: { choices: [{ label: 'Open' }] } },
					{ name: 'Qty', type: 'NUMBER' },
				],
			},
		});
	});

	it('rejects bad options JSON and unknown types before any request', async () => {
		await expect(
			runAction({ action: createTable, propsValue: { databaseId: 'db1', name: 'T', fields: [{ name: 'A', type: 'SELECT', options: '{bad' }] } }),
		).rejects.toThrow('not valid JSON');
		await expect(
			runAction({ action: createTableField, propsValue: { databaseId: 'db1', tableId: 't1', name: 'A', type: 'DATE' } }),
		).rejects.toThrow('cannot be created through the Softr API');
		expect(sendRequest).not.toHaveBeenCalled();
	});

	it('table update always sends the name Softr requires, reading it when not supplied', async () => {
		sendRequest.mockResolvedValueOnce({ status: 200, body: { data: { id: 't1', name: 'Current', fields: [] } } });
		await runAction({ action: updateTable, propsValue: { databaseId: 'db1', tableId: 't1', clearDescription: true } });
		expect(lastRequest()).toMatchObject({ method: 'PUT', url: `${API}/databases/db1/tables/t1`, body: { name: 'Current', description: '' } });
	});

	it('field update merges with the current definition so options are not wiped', async () => {
		const choices = { choices: [{ id: 'c1', label: 'A' }] };
		sendRequest.mockResolvedValueOnce({ status: 200, body: { data: { id: 'f1', name: 'Status', type: 'SELECT', options: choices } } });
		await runAction({ action: updateTableField, propsValue: { databaseId: 'db1', tableId: 't1', fieldId: 'f1', name: 'Renamed' } });
		expect(lastRequest()).toMatchObject({
			method: 'PUT',
			url: `${API}/databases/db1/tables/t1/fields/f1`,
			body: { name: 'Renamed', type: 'SELECT', options: choices },
		});
		sendRequest.mockResolvedValueOnce({ status: 200, body: { data: { id: 'f1', name: 'Status', type: 'SELECT', options: choices } } });
		await runAction({ action: updateTableField, propsValue: { databaseId: 'db1', tableId: 't1', fieldId: 'f1', type: 'LONG_TEXT' } });
		expect(lastRequest().body).toEqual({ name: 'Status', type: 'LONG_TEXT' });
		await expect(
			runAction({ action: updateTableField, propsValue: { databaseId: 'db1', tableId: 't1', fieldId: 'f1' } }),
		).rejects.toThrow('Provide a new name, type or options');
	});

	it('deletes tables and fields', async () => {
		await runAction({ action: deleteTable, propsValue: { databaseId: 'db1', tableId: 't1', force: true } });
		expect(lastRequest()).toMatchObject({ method: 'DELETE', url: `${API}/databases/db1/tables/t1`, queryParams: { force: 'true' } });
		await runAction({ action: deleteTableField, propsValue: { databaseId: 'db1', tableId: 't1', fieldId: 'f1' } });
		expect(lastRequest()).toMatchObject({ method: 'DELETE', url: `${API}/databases/db1/tables/t1/fields/f1` });
	});

	it('lists table views', async () => {
		sendRequest.mockResolvedValueOnce({ status: 200, body: { data: [{ id: 'v1', name: 'Grid' }] } });
		const output = await runAction({ action: listTableViews, propsValue: { databaseId: 'db1', tableId: 't1' } });
		expect(lastRequest().url).toBe(`${API}/databases/db1/tables/t1/views`);
		expect(output).toEqual({ count: 1, views: [{ id: 'v1', name: 'Grid' }] });
	});
});
