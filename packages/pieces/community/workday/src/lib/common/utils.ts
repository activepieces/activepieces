import type { QueryParams } from '@activepieces/pieces-common';

import type {
	WorkdayBusinessObject,
	WorkdayModule,
	WorkdayRecord,
	WorkdaySoapGetPage,
	WorkdaySoapObject,
} from './types';

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

function soapObjects({
	transactionLogOnly,
}: {
	transactionLogOnly?: boolean;
}): WorkdaySoapObject[] {
	return transactionLogOnly ? SOAP_OBJECTS.filter((item) => item.transactionLog) : SOAP_OBJECTS;
}

function resolveSoapObject({ value }: { value: unknown }): WorkdaySoapObject {
	const found = SOAP_OBJECTS.find((item) => item.value === value);
	if (!found) {
		throw new Error('Select a valid business object.');
	}
	return found;
}

function buildSoapGetRequest({
	object,
	ids = [],
	updatedFrom,
	updatedThrough,
	page,
	asOfEntryDateTime,
}: {
	object: WorkdaySoapObject;
	ids?: string[];
	updatedFrom?: string;
	updatedThrough?: string;
	page?: number;
	asOfEntryDateTime?: string;
}): string {
	const references = ids
		.map((id) => {
			const idType = WID_PATTERN.test(id) ? 'WID' : object.idType;
			return `<bsvc:${object.referenceElement}><bsvc:ID bsvc:type="${idType}">${escapeXml({
				value: id,
			})}</bsvc:ID></bsvc:${object.referenceElement}>`;
		})
		.join('');
	const transactionLog =
		updatedFrom && updatedThrough
			? `<bsvc:Transaction_Log_Criteria_Data><bsvc:Transaction_Date_Range_Data><bsvc:Updated_From>${escapeXml(
					{ value: updatedFrom },
			  )}</bsvc:Updated_From><bsvc:Updated_Through>${escapeXml({
					value: updatedThrough,
			  })}</bsvc:Updated_Through></bsvc:Transaction_Date_Range_Data></bsvc:Transaction_Log_Criteria_Data>`
			: '';
	const criteria = object.referencesInCriteria ? `${transactionLog}${references}` : transactionLog;
	const filter = [
		asOfEntryDateTime
			? `<bsvc:As_Of_Entry_DateTime>${escapeXml({
					value: asOfEntryDateTime,
			  })}</bsvc:As_Of_Entry_DateTime>`
			: '',
		page ? `<bsvc:Page>${page}</bsvc:Page>` : '',
		`<bsvc:Count>${SOAP_PAGE_SIZE}</bsvc:Count>`,
	].join('');
	const responseGroup = object.responseGroup
		? `<bsvc:Response_Group>${object.responseGroup
				.map((flag) => `<bsvc:${flag}>true</bsvc:${flag}>`)
				.join('')}</bsvc:Response_Group>`
		: '';
	return [
		`<bsvc:${object.operation}_Request xmlns:bsvc="urn:com.workday/bsvc">`,
		references && !object.referencesInCriteria
			? `<bsvc:Request_References>${references}</bsvc:Request_References>`
			: '',
		criteria ? `<bsvc:Request_Criteria>${criteria}</bsvc:Request_Criteria>` : '',
		`<bsvc:Response_Filter>${filter}</bsvc:Response_Filter>`,
		responseGroup,
		`</bsvc:${object.operation}_Request>`,
	].join('');
}

function readSoapGetPage({
	object,
	body,
}: {
	object: WorkdaySoapObject;
	body: WorkdayRecord;
}): WorkdaySoapGetPage {
	const response = asRecord({ value: body[`${object.operation}_Response`] });
	const results = asRecord({ value: response['Response_Results'] });
	const filter = asRecord({ value: response['Response_Filter'] });
	const data = asRecord({ value: response['Response_Data'] });
	const records = toArray({ value: data[object.recordElement] }).map((record) =>
		simplifySoapValue({ value: record }),
	);
	const asOf = filter['As_Of_Entry_DateTime'];
	return {
		records: records
			.filter((record): record is WorkdayRecord => isPlainRecord(record))
			.map((record) => ({
				id: asRecord({ value: record[`${object.recordElement}_Reference`] })['WID'],
				...record,
			})),
		totalPages: Number(results['Total_Pages'] ?? 1) || 1,
		asOfEntryDateTime: typeof asOf === 'string' ? asOf : undefined,
	};
}

function simplifySoapValue({ value }: { value: unknown }): unknown {
	if (Array.isArray(value)) {
		return value.map((item) => simplifySoapValue({ value: item }));
	}
	if (!isPlainRecord(value)) {
		return value;
	}
	const ids = value['ID'];
	if (
		ids !== undefined &&
		Object.keys(value).every((key) => key === 'ID' || key.startsWith('@_'))
	) {
		const entries = toArray({ value: ids }).flatMap((id) =>
			isPlainRecord(id) && typeof id['@_type'] === 'string'
				? [[id['@_type'], String(id['#text'])]]
				: [],
		);
		const descriptor = value['@_Descriptor'];
		return {
			...Object.fromEntries(entries),
			...(typeof descriptor === 'string' ? { descriptor } : {}),
		};
	}
	return Object.fromEntries(
		Object.entries(value).map(([key, nested]) => [
			key.startsWith('@_') ? key.slice(2) : key,
			simplifySoapValue({ value: nested }),
		]),
	);
}

function toArray({ value }: { value: unknown }): unknown[] {
	if (value === undefined || value === null) {
		return [];
	}
	return Array.isArray(value) ? value : [value];
}

function asRecord({ value }: { value: unknown }): WorkdayRecord {
	return isPlainRecord(value) ? value : {};
}

function isPlainRecord(value: unknown): value is WorkdayRecord {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
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
	soapObjects,
	resolveSoapObject,
	buildSoapGetRequest,
	readSoapGetPage,
};

const MAX_FLATTEN_DEPTH = 4;
const CUSTOM_BUSINESS_OBJECT = '__custom__';
const SOAP_PAGE_SIZE = 100;
const WID_PATTERN = /^[0-9a-f]{32}$/i;

const SOAP_OBJECTS: WorkdaySoapObject[] = [
	{
		label: 'Worker',
		value: 'workers',
		service: 'Human_Resources',
		operation: 'Get_Workers',
		referenceElement: 'Worker_Reference',
		idType: 'Employee_ID',
		recordElement: 'Worker',
		transactionLog: true,
		responseGroup: [
			'Include_Reference',
			'Include_Personal_Information',
			'Include_Employment_Information',
		],
	},
	{
		label: 'Organization',
		value: 'organizations',
		service: 'Human_Resources',
		operation: 'Get_Organizations',
		referenceElement: 'Organization_Reference',
		idType: 'Organization_Reference_ID',
		recordElement: 'Organization',
	},
	{
		label: 'Job Profile',
		value: 'job_profiles',
		service: 'Human_Resources',
		operation: 'Get_Job_Profiles',
		referenceElement: 'Job_Profile_Reference',
		idType: 'Job_Profile_ID',
		recordElement: 'Job_Profile',
		transactionLog: true,
		responseGroup: ['Include_Reference', 'Include_Job_Profile_Basic_Data'],
	},
	{
		label: 'Location',
		value: 'locations',
		service: 'Human_Resources',
		operation: 'Get_Locations',
		referenceElement: 'Location_Reference',
		idType: 'Location_ID',
		recordElement: 'Location',
		responseGroup: ['Include_Reference', 'Include_Location_Data'],
	},
	{
		label: 'Job Family',
		value: 'job_families',
		service: 'Human_Resources',
		operation: 'Get_Job_Families',
		referenceElement: 'Job_Family_Reference',
		idType: 'Job_Family_ID',
		recordElement: 'Job_Family',
	},
	{
		label: 'Job Family Group',
		value: 'job_family_groups',
		service: 'Human_Resources',
		operation: 'Get_Job_Family_Groups',
		referenceElement: 'Job_Family_Group_Reference',
		idType: 'Job_Family_ID',
		recordElement: 'Job_Family_Group',
	},
	{
		label: 'Job Classification Group',
		value: 'job_classification_groups',
		service: 'Human_Resources',
		operation: 'Get_Job_Classification_Groups',
		referenceElement: 'Job_Classification_Group_Reference',
		idType: 'Job_Classification_Group_ID',
		recordElement: 'Job_Classification_Group',
	},
	{
		label: 'Position',
		value: 'positions',
		service: 'Staffing',
		operation: 'Get_Positions',
		referenceElement: 'Positions_Reference',
		idType: 'Position_ID',
		recordElement: 'Position',
		transactionLog: true,
		responseGroup: ['Include_Reference', 'Include_Position_Definition_Data'],
	},
	{
		label: 'Worker Document',
		value: 'worker_documents',
		service: 'Staffing',
		operation: 'Get_Worker_Documents',
		referenceElement: 'Worker_Document_Reference',
		idType: 'File_ID',
		recordElement: 'Worker_Document',
		responseGroup: ['Include_Reference'],
	},
	{
		label: 'Citizenship Status',
		value: 'citizenship_statuses',
		service: 'Staffing',
		operation: 'Get_Citizenship_Statuses',
		referenceElement: 'Citizenship_Status_Reference',
		idType: 'Citizenship_Status_Code',
		recordElement: 'Citizenship_Status',
	},
	{
		label: 'Job Requisition',
		value: 'job_requisitions',
		service: 'Recruiting',
		operation: 'Get_Job_Requisitions',
		referenceElement: 'Job_Requisition_Reference',
		idType: 'Job_Requisition_ID',
		recordElement: 'Job_Requisition',
		transactionLog: true,
		responseGroup: ['Include_Reference', 'Include_Job_Requisition_Definition_Data'],
	},
	{
		label: 'Evergreen Requisition',
		value: 'evergreen_requisitions',
		service: 'Recruiting',
		operation: 'Get_Evergreen_Requisitions',
		referenceElement: 'Evergreen_Job_Requisition_Reference',
		idType: 'Job_Requisition_ID',
		recordElement: 'Evergreen_Job_Requisition',
		transactionLog: true,
		responseGroup: ['Include_Reference', 'Include_Job_Requisition_Definition_Data'],
	},
	{
		label: 'Applicant',
		value: 'applicants',
		service: 'Recruiting',
		operation: 'Get_Applicants',
		referenceElement: 'Applicant_Reference',
		idType: 'Applicant_ID',
		recordElement: 'Applicant',
		responseGroup: [
			'Include_Reference',
			'Include_Personal_Information',
			'Include_Recruiting_Information',
		],
	},
	{
		label: 'Payee',
		value: 'payees',
		service: 'Payroll_Interface',
		operation: 'Get_Payees',
		referenceElement: 'Payee_Reference',
		idType: 'Employee_ID',
		recordElement: 'Payee',
		referencesInCriteria: true,
		idsRequired: true,
		responseGroup: ['Include_Reference', 'Include_Payee_Personal_Information'],
	},
	{
		label: 'Customer Contract',
		value: 'customer_contracts',
		service: 'Revenue_Management',
		operation: 'Get_Customer_Contracts',
		referenceElement: 'Customer_Contract_Reference',
		idType: 'Customer_Contract_Reference_ID',
		recordElement: 'Customer_Contract',
		responseGroup: ['Include_Reference', 'Include_Customer_Contract_Data'],
	},
];

const BUSINESS_OBJECTS_BY_MODULE: Record<string, WorkdayBusinessObject[]> = {
	recruiting: [],
	onboarding: [
		{
			label: 'Worker',
			value: 'workers',
			path: '/workers',
			service: 'staffing/v6',
			wqlDataSource: 'allWorkers',
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
