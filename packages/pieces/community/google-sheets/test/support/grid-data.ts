import { sheets_v4 } from '@googleapis/sheets';

export function gridFromValues({ raw, display }: { raw: unknown[][]; display: unknown[][] }): { data: sheets_v4.Schema$Spreadsheet } {
	const rowData = raw.map((row, rowIndex) => ({
		values: row.map((value, column) => cellData({ value, formatted: display[rowIndex]?.[column] })),
	}));
	return { data: { sheets: [{ data: [{ startRow: 0, rowData }] }] } };
}

export function isGridRequest({ params }: { params: unknown }): boolean {
	return typeof params === 'object' && params !== null && Reflect.get(params, 'includeGridData') === true && Reflect.has(params, 'ranges');
}

export async function gridViaValues({ params, valuesGet }: { params: unknown; valuesGet: ValuesGet }): Promise<{ data: sheets_v4.Schema$Spreadsheet }> {
	const ranges: unknown = typeof params === 'object' && params !== null ? Reflect.get(params, 'ranges') : undefined;
	const range = Array.isArray(ranges) && typeof ranges[0] === 'string' ? ranges[0] : '';
	const raw = (await valuesGet({ range, valueRenderOption: 'UNFORMATTED_VALUE' })).data.values ?? [];
	const display = (await valuesGet({ range, valueRenderOption: 'FORMATTED_VALUE' })).data.values ?? [];
	return gridFromValues({ raw, display });
}

type ValuesGet = (params: { range: string; valueRenderOption: string }) => Promise<{ data: { values?: unknown[][] } }>;

function cellData({ value, formatted }: { value: unknown; formatted: unknown }): sheets_v4.Schema$CellData {
	if (value === undefined || value === null || value === '') return {};
	const formattedValue = formatted === undefined || formatted === null ? String(value) : String(formatted);
	if (typeof value === 'number') return { effectiveValue: { numberValue: value }, formattedValue };
	if (typeof value === 'boolean') return { effectiveValue: { boolValue: value }, formattedValue };
	return { effectiveValue: { stringValue: String(value) }, formattedValue };
}
