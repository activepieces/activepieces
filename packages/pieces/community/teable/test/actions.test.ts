import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateRecordAction } from '../src/lib/actions/update-record';
import { createRecordAction } from '../src/lib/actions/create-record';
import { createRecordsAction } from '../src/lib/actions/create-records';
import { updateRecordsAction } from '../src/lib/actions/update-records';
import { deleteRecordsAction } from '../src/lib/actions/delete-records';
import { findRecordsAction } from '../src/lib/actions/find-records';
import { addCommentAction } from '../src/lib/actions/add-comment';
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

function calls(): { method: string; url: string; body?: unknown }[] {
	return sendRequest.mock.calls.map((c) => c[0]);
}

beforeEach(() => {
	sendRequest.mockReset();
});

describe('Update Record (builder)', () => {
	it('omits empty inputs, sends null for Fields to Clear, and sets typecast', async () => {
		sendRequest.mockResolvedValueOnce({ body: { id: 'rec1', fields: {} } });
		await runAction({
			action: updateRecordAction,
			propsValue: {
				base_id: 'bse1',
				table_id: 'tbl1',
				record_id: 'rec1',
				fields: { Name: 'Jane', Notes: '', Age: undefined, Done: false, Zero: 0 },
				fields_to_clear: ['Email'],
			},
		});
		expect(calls()[0]).toMatchObject({
			method: 'PATCH',
			body: {
				record: { fields: { Name: 'Jane', Done: false, Zero: 0, Email: null } },
				typecast: true,
			},
		});
	});

	it('refuses an update with nothing to change', async () => {
		await expect(
			runAction({
				action: updateRecordAction,
				propsValue: {
					base_id: 'bse1',
					table_id: 'tbl1',
					record_id: 'rec1',
					fields: { Name: '' },
					fields_to_clear: [],
				},
			})
		).rejects.toThrow(/Set at least one field value or pick a field to clear/);
		expect(sendRequest).not.toHaveBeenCalled();
	});
});

describe('Create Record (builder)', () => {
	it('keeps the records wrapper and sends typecast', async () => {
		sendRequest.mockResolvedValueOnce({ body: { records: [{ id: 'rec1', fields: {} }] } });
		const output = await runAction({
			action: createRecordAction,
			propsValue: { base_id: 'bse1', table_id: 'tbl1', fields: { Name: 'Jane' } },
		});
		expect(calls()[0]).toMatchObject({
			method: 'POST',
			body: { records: [{ fields: { Name: 'Jane' } }], typecast: true },
		});
		expect(output).toEqual({ records: [{ id: 'rec1', fields: {} }] });
	});

	it('refuses an empty record', async () => {
		await expect(
			runAction({
				action: createRecordAction,
				propsValue: { base_id: 'bse1', table_id: 'tbl1', fields: {} },
			})
		).rejects.toThrow(/at least one field/);
	});
});

describe('Create Records (batch)', () => {
	it('wraps each item in a fields object', async () => {
		sendRequest.mockResolvedValueOnce({ body: { records: [] } });
		await runAction({
			action: createRecordsAction,
			propsValue: { base_id: 'bse1', table_id: 'tbl1', records: [{ Name: 'a' }, { Name: 'b' }] },
		});
		expect(calls()[0].body).toMatchObject({
			records: [{ fields: { Name: 'a' } }, { fields: { Name: 'b' } }],
			typecast: true,
		});
	});

	it('refuses an empty array and non-object items', async () => {
		await expect(
			runAction({
				action: createRecordsAction,
				propsValue: { base_id: 'bse1', table_id: 'tbl1', records: [] },
			})
		).rejects.toThrow(/non-empty JSON array/);
		await expect(
			runAction({
				action: createRecordsAction,
				propsValue: { base_id: 'bse1', table_id: 'tbl1', records: ['nope'] },
			})
		).rejects.toThrow(/item 1 must be an object/);
	});
});

describe('Update Records (batch)', () => {
	it('requires id and non-empty fields per item and passes nulls through', async () => {
		sendRequest.mockResolvedValueOnce({ body: [] });
		await runAction({
			action: updateRecordsAction,
			propsValue: {
				base_id: 'bse1',
				table_id: 'tbl1',
				records: [{ id: 'rec1', fields: { Name: 'Jane', Notes: null } }],
			},
		});
		expect(calls()[0].body).toMatchObject({
			records: [{ id: 'rec1', fields: { Name: 'Jane', Notes: null } }],
			typecast: true,
		});
		await expect(
			runAction({
				action: updateRecordsAction,
				propsValue: { base_id: 'bse1', table_id: 'tbl1', records: [{ fields: { Name: 'x' } }] },
			})
		).rejects.toThrow(/item 1 is missing a record "id"/);
		await expect(
			runAction({
				action: updateRecordsAction,
				propsValue: { base_id: 'bse1', table_id: 'tbl1', records: [{ id: 'rec1', fields: {} }] },
			})
		).rejects.toThrow(/non-empty "fields" object/);
	});
});

describe('Delete Records (batch)', () => {
	it('refuses an empty ID list without calling the API', async () => {
		await expect(
			runAction({
				action: deleteRecordsAction,
				propsValue: { base_id: 'bse1', table_id: 'tbl1', recordIds: ['  ', ''] },
			})
		).rejects.toThrow(/at least one record ID/);
		expect(sendRequest).not.toHaveBeenCalled();
	});

	it('sends repeated recordIds params and returns a per-call summary', async () => {
		sendRequest.mockResolvedValueOnce({ body: '' });
		const output = await runAction({
			action: deleteRecordsAction,
			propsValue: { base_id: 'bse1', table_id: 'tbl1', recordIds: ['rec1', 'rec2'] },
		});
		expect(calls()[0].url).toContain('recordIds%5B%5D=rec1&recordIds%5B%5D=rec2');
		expect(output).toEqual({ success: true, deletedCount: 2, recordIds: ['rec1', 'rec2'] });
	});
});

describe('List Records (builder)', () => {
	it('validates Max Records bounds before calling the API', async () => {
		await expect(
			runAction({
				action: findRecordsAction,
				propsValue: { base_id: 'bse1', table_id: 'tbl1', take: 5001 },
			})
		).rejects.toThrow(/between 1 and 5000/);
		await expect(
			runAction({
				action: findRecordsAction,
				propsValue: { base_id: 'bse1', table_id: 'tbl1', take: 0 },
			})
		).rejects.toThrow(/between 1 and 5000/);
		expect(sendRequest).not.toHaveBeenCalled();
	});

	it('returns records with a count and hasMore flag', async () => {
		sendRequest.mockResolvedValueOnce({ body: { records: [{ id: 'rec1', fields: {} }] } });
		const output = await runAction({
			action: findRecordsAction,
			propsValue: { base_id: 'bse1', table_id: 'tbl1', take: 100 },
		});
		expect(output).toEqual({
			records: [{ id: 'rec1', fields: {} }],
			recordCount: 1,
			hasMore: false,
		});
	});
});

describe('Add Comment', () => {
	it('wraps plain text in the Teable rich-text shape', async () => {
		sendRequest.mockResolvedValueOnce({ body: '' });
		const output = await runAction({
			action: addCommentAction,
			propsValue: { base_id: 'bse1', table_id: 'tbl1', record_id: 'rec1', comment: ' Hi there ' },
		});
		expect(calls()[0]).toMatchObject({
			method: 'POST',
			url: 'https://app.teable.ai/api/comment/tbl1/rec1/create',
			body: { content: [{ type: 'p', children: [{ type: 'span', value: 'Hi there' }] }] },
		});
		expect(output).toEqual({ success: true, recordId: 'rec1', comment: 'Hi there' });
	});

	it('refuses an empty comment', async () => {
		await expect(
			runAction({
				action: addCommentAction,
				propsValue: { base_id: 'bse1', table_id: 'tbl1', record_id: 'rec1', comment: '   ' },
			})
		).rejects.toThrow(/Comment must not be empty/);
	});
});
