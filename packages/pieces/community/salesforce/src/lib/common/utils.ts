import { isNil } from '@activepieces/pieces-framework';

function escapeSoqlValue(value: string): string {
	return value
		.replace(/\\/g, '\\\\')
		.replace(/'/g, "\\'")
		.replace(/"/g, '\\"')
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '\\r')
		.replace(/\t/g, '\\t');
}

function escapeSoqlLike(value: string): string {
	return escapeSoqlValue(value).replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function escapeSosl(value: string): string {
	return value.replace(/[?&|!{}[\]()^~*:\\"'+-]/g, (char) => `\\${char}`);
}

function assertApiName({ value, fieldName }: { value: string; fieldName: string }): string {
	const trimmed = value.trim();
	if (!API_NAME_PATTERN.test(trimmed)) {
		throw new Error(`${fieldName} must be a Salesforce API name such as Account or My_Field__c.`);
	}
	return trimmed;
}

function assertId({ value, fieldName }: { value: string; fieldName: string }): string {
	const trimmed = value.trim();
	if (!ID_PATTERN.test(trimmed)) {
		throw new Error(`${fieldName} must be a 15- or 18-character Salesforce record id.`);
	}
	return trimmed;
}

function parseJsonObject({ value, fieldName }: { value: unknown; fieldName: string }): Record<string, unknown> | undefined {
	if (isNil(value) || value === '') {
		return undefined;
	}
	const parsed = typeof value === 'string' ? parseJson({ value, fieldName }) : value;
	if (!isRecord(parsed)) {
		throw new Error(`${fieldName} must be a JSON object.`);
	}
	return parsed;
}

function parseJsonArray({ value, fieldName }: { value: unknown; fieldName: string }): unknown[] | undefined {
	if (isNil(value) || value === '') {
		return undefined;
	}
	const parsed = typeof value === 'string' ? parseJson({ value, fieldName }) : value;
	if (!Array.isArray(parsed)) {
		throw new Error(`${fieldName} must be a JSON array.`);
	}
	return parsed;
}

function toStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.map((item) => String(item).trim()).filter((item) => item.length > 0);
}

function compact(obj: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}

function cleanRecord(record: unknown): unknown {
	if (Array.isArray(record)) {
		return record.map(cleanRecord);
	}
	if (!isRecord(record)) {
		return record;
	}
	return Object.fromEntries(
		Object.entries(record)
			.filter(([key]) => key !== 'attributes')
			.map(([key, value]) => [key, cleanRecord(value)]),
	);
}

function formatQueryResult(result: QueryResult<unknown>) {
	return {
		records: result.records.map(cleanRecord),
		count: result.records.length,
		total_size: result.totalSize,
		done: result.done,
		next_records_url: result.nextRecordsUrl ?? null,
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const salesforceUtils = {
	escapeSoqlValue,
	escapeSoqlLike,
	escapeSosl,
	assertApiName,
	assertId,
	parseJsonObject,
	parseJsonArray,
	toStringArray,
	compact,
	cleanRecord,
	formatQueryResult,
	isRecord,
};

function parseJson({ value, fieldName }: { value: string; fieldName: string }): unknown {
	try {
		return JSON.parse(value);
	} catch {
		throw new Error(`${fieldName} must be valid JSON.`);
	}
}

const API_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;
const ID_PATTERN = /^[a-zA-Z0-9]{15}(?:[a-zA-Z0-9]{3})?$/;

export type SalesforceRecord = Record<string, unknown>;

export type QueryResult<T> = {
	totalSize: number;
	done: boolean;
	nextRecordsUrl?: string;
	records: T[];
};
