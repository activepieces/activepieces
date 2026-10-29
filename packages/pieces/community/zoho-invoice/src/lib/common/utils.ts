import type { QueryParams } from '@activepieces/pieces-common';

function toQuery(params: Record<string, string | number | boolean | undefined>): QueryParams {
	return Object.fromEntries(
		Object.entries(params)
			.filter(
				(entry): entry is [string, string | number | boolean] =>
					entry[1] !== undefined && entry[1] !== '',
			)
			.map(([key, value]) => [key, String(value)]),
	);
}

function compact(body: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(body).filter(
			(entry) => entry[1] !== undefined && entry[1] !== null && entry[1] !== '',
		),
	);
}

function toOptionalBoolean({ value }: { value: string | undefined }): boolean | undefined {
	return value === undefined ? undefined : value === 'true';
}

function toRecords({
	rows,
	propName,
}: {
	rows: unknown[];
	propName: string;
}): Record<string, unknown>[] {
	return rows.map((row) => {
		if (typeof row !== 'object' || row === null || Array.isArray(row)) {
			throw new Error(`Each entry of ${propName} must be an object.`);
		}
		return Object.fromEntries(Object.entries(row));
	});
}

function toLineItems({
	rows,
}: {
	rows: unknown[] | undefined;
}): Record<string, unknown>[] | undefined {
	if (rows === undefined || rows.length === 0) {
		return undefined;
	}
	return toRecords({ rows, propName: 'Line Items' }).map((row) =>
		compact({
			line_item_id: row['lineItemId'],
			item_id: row['itemId'],
			name: row['name'],
			description: row['description'],
			rate: row['rate'],
			quantity: row['quantity'],
			discount: row['discount'],
			tax_id: row['taxId'],
		}),
	);
}

export const zohoInvoiceUtils = { toQuery, compact, toOptionalBoolean, toRecords, toLineItems };
