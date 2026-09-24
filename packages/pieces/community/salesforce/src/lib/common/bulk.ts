import { salesforceUtils } from './utils';

function parseCsv(text: string): Record<string, string>[] {
	const rows = tokenizeCsv(text);
	if (rows.length === 0) {
		return [];
	}
	const [header, ...data] = rows;
	return data
		.filter((row) => !(row.length === 1 && row[0] === ''))
		.map((row) => Object.fromEntries(header.map((column, index) => [column, row[index] ?? ''])));
}

function formatJob(body: unknown): Record<string, unknown> {
	if (!salesforceUtils.isRecord(body)) {
		return {};
	}
	return Object.fromEntries(JOB_FIELDS.map((field) => [field, body[field] ?? null]));
}

export const bulkUtils = {
	parseCsv,
	formatJob,
	BULK_API_PATH: '/services/data/v58.0/jobs',
};

function tokenizeCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let inQuotes = false;
	let touched = false;
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (inQuotes) {
			if (char === '"' && text[i + 1] === '"') {
				field += '"';
				i++;
			} else if (char === '"') {
				inQuotes = false;
			} else {
				field += char;
			}
			continue;
		}
		if (char === '"') {
			inQuotes = true;
			touched = true;
		} else if (char === ',') {
			row.push(field);
			field = '';
			touched = true;
		} else if (char === '\n' || char === '\r') {
			if (char === '\r' && text[i + 1] === '\n') {
				i++;
			}
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
			touched = false;
		} else {
			field += char;
			touched = true;
		}
	}
	if (touched || field !== '' || row.length > 0) {
		row.push(field);
		rows.push(row);
	}
	return rows;
}

const JOB_FIELDS = [
	'id',
	'state',
	'object',
	'operation',
	'numberRecordsProcessed',
	'numberRecordsFailed',
	'errorMessage',
	'createdDate',
	'systemModstamp',
	'totalProcessingTime',
];
