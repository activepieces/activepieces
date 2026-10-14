import type { QueryParams } from '@activepieces/pieces-common';

import type { WorkdayBusinessObject, WorkdayModule, WorkdayRecord } from './types';

function escapeXml({ value }: { value: string }): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function flattenRecord({
	value,
	prefix = '',
	depth = 0,
}: {
	value: unknown;
	prefix?: string;
	depth?: number;
}): WorkdayRecord {
	if (value === null || value === undefined) {
		return prefix ? { [prefix]: value } : {};
	}
	if (Array.isArray(value)) {
		return prefix ? { [prefix]: JSON.stringify(value) } : { items: JSON.stringify(value) };
	}
	if (typeof value !== 'object') {
		return prefix ? { [prefix]: value } : { value };
	}
	if (depth >= MAX_FLATTEN_DEPTH) {
		return prefix ? { [prefix]: JSON.stringify(value) } : {};
	}
	const result: WorkdayRecord = {};
	for (const [key, nested] of Object.entries(value)) {
		const nextKey = prefix ? `${prefix}_${key}` : key;
		Object.assign(result, flattenRecord({ value: nested, prefix: nextKey, depth: depth + 1 }));
	}
	return result;
}

function formatOutput({
	record,
	module,
}: {
	record: WorkdayRecord;
	module: WorkdayModule;
}): WorkdayRecord {
	const flat = flattenRecord({ value: record });
	const standard: WorkdayRecord = {};

	if (module === 'recruiting') {
		standard['job_requisition_id'] =
			record['id'] ?? record['workdayID'] ?? readNestedId({ value: record['jobRequisition'] });
		standard['title'] =
			record['title'] ??
			record['descriptor'] ??
			readNestedDescriptor({ value: record['jobRequisition'] });
		standard['location'] =
			readNestedDescriptor({ value: record['location'] }) ?? record['location'];
		standard['candidate_id'] = readNestedId({ value: record['candidate'] });
		standard['application_status'] =
			record['applicationStatus'] ?? record['status'] ?? record['stage'];
	} else if (module === 'onboarding') {
		standard['employee_id'] =
			record['id'] ?? record['workdayID'] ?? readNestedId({ value: record['worker'] });
		standard['name'] =
			record['descriptor'] ??
			record['fullName'] ??
			readNestedDescriptor({ value: record['worker'] });
		standard['hire_date'] = record['hireDate'] ?? record['createdMoment'];
		standard['status'] = record['status'] ?? record['workerStatus'];
	} else if (module === 'hr_services_time_tracking') {
		standard['employee_id'] =
			readNestedId({ value: record['worker'] }) ??
			readNestedId({ value: record['employee'] }) ??
			record['workerId'];
		standard['status'] = record['status'];

		const isTimeEntry =
			'hours' in record ||
			'quantity' in record ||
			'reportedQuantity' in record ||
			'timeBlockDate' in record ||
			'entryDate' in record ||
			'timeEntryId' in record;

		if (isTimeEntry) {
			standard['time_entry_id'] = record['id'] ?? record['timeEntryId'];
			standard['date'] =
				record['date'] ?? record['entryDate'] ?? record['timeBlockDate'] ?? record['calendarDate'];
			standard['hours'] = record['hours'] ?? record['quantity'] ?? record['reportedQuantity'];
		} else {
			standard['case_id'] = record['id'] ?? record['workdayID'];
			standard['description'] = record['description'] ?? record['descriptor'] ?? record['subject'];
		}
	}

	return { ...flat, ...standard };
}

function formatOutputs({
	records,
	module,
}: {
	records: WorkdayRecord[];
	module: WorkdayModule;
}): WorkdayRecord[] {
	return records.map((record) => formatOutput({ record, module }));
}

function getRecordTimestamp({
	record,
	preferredField,
}: {
	record: WorkdayRecord;
	preferredField?: string;
}): string | undefined {
	const candidates = [
		preferredField,
		'lastFunctionallyUpdated',
		'updatedMoment',
		'updatedDate',
		'createdMoment',
		'createdDate',
		'hireDate',
		'date',
	].filter((field): field is string => Boolean(field));

	for (const field of candidates) {
		const value = record[field];
		if (typeof value === 'string' && value.length > 0) {
			return value;
		}
	}
	return undefined;
}

function readNestedId({ value }: { value: unknown }): unknown {
	if (value === null || value === undefined) {
		return null;
	}
	if (typeof value === 'object' && 'id' in value) {
		return value.id;
	}
	return value;
}

function readNestedDescriptor({ value }: { value: unknown }): unknown {
	if (value === null || value === undefined) {
		return null;
	}
	if (typeof value === 'object') {
		const descriptor = 'descriptor' in value ? value.descriptor : undefined;
		const name = 'name' in value ? value.name : undefined;
		const fullName = 'fullName' in value ? value.fullName : undefined;
		return descriptor ?? name ?? fullName ?? null;
	}
	return value;
}

function toQueryParams({ value }: { value: WorkdayRecord | undefined }): QueryParams {
	return Object.fromEntries(Object.entries(value ?? {}).map(([key, item]) => [key, String(item)]));
}

function businessObjectsForModule({ module }: { module: string }): WorkdayBusinessObject[] {
	return BUSINESS_OBJECTS_BY_MODULE[module] ?? [];
}

function resolveBusinessObject({
	module,
	selection,
}: {
	module: string | undefined;
	selection: WorkdayRecord | undefined;
}): WorkdayBusinessObject {
	const objectType = selection?.['objectType'];
	if (objectType === CUSTOM_BUSINESS_OBJECT) {
		const customPath = selection?.['customPath'];
		if (typeof customPath !== 'string' || !customPath.trim()) {
			throw new Error('Custom Business Object Path is required for custom objects.');
		}
		const rawService = selection?.['customService'];
		const customService = typeof rawService === 'string' ? rawService : undefined;
		const path = customPath.startsWith('/') ? customPath : `/${customPath}`;
		return {
			label: 'Custom',
			value: 'custom',
			path,
			service: LEGACY_SERVICE_PATHS[customService ?? ''] ?? customService ?? 'v1',
		};
	}
	const found = businessObjectsForModule({ module: module ?? '' }).find(
		(item) => item.value === objectType,
	);
	if (!found) {
		throw new Error('Select a valid business object for the chosen module.');
	}
	return found;
}

function toWorkdayModule({ module }: { module: string }): WorkdayModule {
	if (
		module === 'recruiting' ||
		module === 'onboarding' ||
		module === 'hr_services_time_tracking'
	) {
		return module;
	}
	throw new Error('Invalid Workday module selected.');
}

export const workdayUtils = {
	escapeXml,
	flattenRecord,
	formatOutput,
	formatOutputs,
	getRecordTimestamp,
	toQueryParams,
	readNestedId,
	readNestedDescriptor,
	businessObjectsForModule,
	resolveBusinessObject,
	toWorkdayModule,
};

const MAX_FLATTEN_DEPTH = 4;
const CUSTOM_BUSINESS_OBJECT = '__custom__';

const BUSINESS_OBJECTS_BY_MODULE: Record<string, WorkdayBusinessObject[]> = {
	recruiting: [
		{
			label: 'Job Requisition',
			value: 'jobRequisitions',
			path: '/jobRequisitions',
			service: 'staffing/v6',
			wqlDataSource: 'jobRequisitions',
		},
		{
			label: 'Job Application',
			value: 'jobApplications',
			path: '/jobApplications',
			service: 'staffing/v6',
			wqlDataSource: 'jobApplications',
		},
		{
			label: 'Candidate',
			value: 'candidates',
			path: '/candidates',
			service: 'staffing/v6',
			wqlDataSource: 'candidates',
		},
	],
	onboarding: [
		{
			label: 'Worker',
			value: 'workers',
			path: '/workers',
			service: 'staffing/v6',
			wqlDataSource: 'allWorkers',
		},
		{
			label: 'Pre-Hire',
			value: 'preHires',
			path: '/preHires',
			service: 'staffing/v6',
			wqlDataSource: 'preHires',
		},
	],
	hr_services_time_tracking: [
		{
			label: 'Case',
			value: 'cases',
			path: '/cases',
			service: 'helpCase/v4',
			wqlDataSource: 'cases',
		},
		{
			label: 'Time Entry',
			value: 'timeEntries',
			path: '/workerTimeBlocks',
			service: 'timeTracking/v7',
			wqlDataSource: 'workerTimeBlocks',
		},
	],
};

const LEGACY_SERVICE_PATHS: Record<string, string> = {
	'expenseManagement/v1': 'expense/v1',
	'time/v2': 'timeTracking/v7',
	'resourceManagement/v3': 'procurement/v5',
};
