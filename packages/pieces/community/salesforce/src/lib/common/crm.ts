import { HttpMethod } from '@activepieces/pieces-common';
import { isNil, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { callSalesforceApi, querySalesforceApi } from '.';
import { QueryResult, salesforceUtils } from './utils';

function buildBody({ fields, additionalFields }: { fields: Record<string, unknown>; additionalFields: unknown }): Record<string, unknown> {
	return {
		...salesforceUtils.parseJsonObject({ value: additionalFields, fieldName: 'Additional Fields' }),
		...salesforceUtils.compact(Object.fromEntries(Object.entries(fields).filter(([key]) => /^[A-Z]/.test(key)))),
	};
}

async function createRecord({ auth, object, fields, additionalFields }: RecordWriteParams & { object: string }) {
	const response = await callSalesforceApi<{ id: string; success: boolean }>(
		HttpMethod.POST,
		auth,
		`/services/data/v56.0/sobjects/${object}`,
		buildBody({ fields, additionalFields })
	);
	return { id: response.body.id, success: response.body.success };
}

async function updateRecord({ auth, object, recordId, fields, additionalFields }: RecordWriteParams & { object: string; recordId: string }) {
	const id = salesforceUtils.assertId({ value: recordId, fieldName: 'Record ID' });
	const body = buildBody({ fields, additionalFields });
	const updatedFields = Object.keys(body);
	if (updatedFields.length === 0) {
		throw new Error('Provide at least one field to update.');
	}
	await callSalesforceApi(HttpMethod.PATCH, auth, `/services/data/v56.0/sobjects/${object}/${id}`, body);
	return { id, success: true, updated_fields: updatedFields };
}

async function query({ auth, soql }: { auth: OAuth2PropertyValue; soql: string }) {
	const response = await querySalesforceApi<QueryResult<unknown>>(HttpMethod.GET, auth, soql);
	return response.body;
}

async function searchRecords({ auth, object, fields, conditions, orderBy, limit }: SearchParams) {
	const where = conditions.filter((condition): condition is string => typeof condition === 'string');
	const whereClause = where.length > 0 ? ` WHERE ${where.join(' AND ')}` : '';
	const soql = `SELECT ${fields.join(', ')} FROM ${object}${whereClause} ORDER BY ${orderBy} LIMIT ${clampLimit(limit)}`;
	return salesforceUtils.formatQueryResult(await query({ auth, soql }));
}

function equals({ field, value }: ConditionParams<string>): string | undefined {
	return isBlank(value) ? undefined : `${field} = '${salesforceUtils.escapeSoqlValue(value.trim())}'`;
}

function contains({ field, value }: ConditionParams<string>): string | undefined {
	return isBlank(value) ? undefined : `${field} LIKE '%${salesforceUtils.escapeSoqlLike(value.trim())}%'`;
}

function idEquals({ field, value }: ConditionParams<string>): string | undefined {
	return isBlank(value) ? undefined : `${field} = '${salesforceUtils.assertId({ value, fieldName: field })}'`;
}

function booleanEquals({ field, value }: ConditionParams<boolean>): string | undefined {
	if (isNil(value) || String(value) === '') {
		return undefined;
	}
	return `${field} = ${String(value).toLowerCase() === 'true' ? 'TRUE' : 'FALSE'}`;
}

function numberCompare({ field, operator, value }: ConditionParams<number> & { operator: '>=' | '<=' }): string | undefined {
	if (isNil(value)) {
		return undefined;
	}
	if (!Number.isFinite(value)) {
		throw new Error(`${field} must be a number.`);
	}
	return `${field} ${operator} ${value}`;
}

function dateCompare({ field, operator, value }: ConditionParams<string> & { operator: '>=' | '<=' }): string | undefined {
	const date = assertDate({ value, fieldName: field });
	return isNil(date) ? undefined : `${field} ${operator} ${date}`;
}

function assertDate({ value, fieldName }: { value: string | undefined | null; fieldName: string }): string | undefined {
	if (isBlank(value)) {
		return undefined;
	}
	const trimmed = value.trim();
	if (!DATE_PATTERN.test(trimmed) || Number.isNaN(Date.parse(trimmed))) {
		throw new Error(`${fieldName} must be a date in YYYY-MM-DD format.`);
	}
	return trimmed;
}

function exactlyOne({ values, fieldNames }: { values: (string | undefined | null)[]; fieldNames: string }): number {
	const provided = values.map((value, index) => (isBlank(value) ? -1 : index)).filter((index) => index >= 0);
	if (provided.length !== 1) {
		throw new Error(`Provide exactly one of ${fieldNames}.`);
	}
	return provided[0];
}

async function getClosedTaskStatus({ auth }: { auth: OAuth2PropertyValue }): Promise<string> {
	const result = await query({
		auth,
		soql: 'SELECT ApiName, MasterLabel FROM TaskStatus WHERE IsClosed = true ORDER BY SortOrder LIMIT 1',
	});
	const record = result.records[0];
	if (!salesforceUtils.isRecord(record)) {
		return 'Completed';
	}
	const status = record['ApiName'] ?? record['MasterLabel'];
	return typeof status === 'string' && status.length > 0 ? status : 'Completed';
}

function booleanFilterProp({ displayName, description }: { displayName: string; description: string }) {
	return Property.StaticDropdown<boolean>({
		displayName,
		description,
		required: false,
		options: {
			options: [
				{ label: 'Yes', value: true },
				{ label: 'No', value: false },
			],
		},
	});
}

export const crmUtils = {
	createRecord,
	updateRecord,
	query,
	searchRecords,
	equals,
	contains,
	idEquals,
	booleanEquals,
	numberCompare,
	dateCompare,
	assertDate,
	exactlyOne,
	getClosedTaskStatus,
	booleanFilterProp,
	additionalFieldsProp: Property.Json({
		displayName: 'Additional Fields',
		description: 'Any other fields, including custom ones, as a JSON object of API name to value, e.g. {"My_Field__c": "x"}.',
		required: false,
	}),
	limitProp: Property.Number({
		displayName: 'Limit',
		description: 'Maximum records to return (default 50, max 200).',
		required: false,
	}),
};

function clampLimit(limit: number | undefined | null): number {
	if (isNil(limit) || !Number.isFinite(limit)) {
		return DEFAULT_LIMIT;
	}
	return Math.min(Math.max(Math.floor(limit), 1), MAX_LIMIT);
}

function isBlank(value: string | undefined | null): value is undefined | null {
	return isNil(value) || value.trim() === '';
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type RecordWriteParams = {
	auth: OAuth2PropertyValue;
	fields: Record<string, unknown>;
	additionalFields: unknown;
};

type SearchParams = {
	auth: OAuth2PropertyValue;
	object: string;
	fields: string[];
	conditions: (string | undefined)[];
	orderBy: string;
	limit: number | undefined | null;
};

type ConditionParams<T> = {
	field: string;
	value: T | undefined | null;
};
