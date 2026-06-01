const MAX_FLATTEN_DEPTH = 4;

export function flattenRecord(
	value: unknown,
	prefix = '',
	depth = 0,
): Record<string, unknown> {
	if (value === null || value === undefined) {
		return prefix ? { [prefix]: value } : {};
	}
	if (Array.isArray(value)) {
		return prefix
			? { [prefix]: JSON.stringify(value) }
			: { items: JSON.stringify(value) };
	}
	if (typeof value !== 'object') {
		return prefix ? { [prefix]: value } : { value };
	}
	if (depth >= MAX_FLATTEN_DEPTH) {
		return prefix ? { [prefix]: JSON.stringify(value) } : {};
	}
	const result: Record<string, unknown> = {};
	for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
		const nextKey = prefix ? `${prefix}_${key}` : key;
		Object.assign(result, flattenRecord(nested, nextKey, depth + 1));
	}
	return result;
}

export function formatWorkdayOutput(
	record: Record<string, unknown>,
	module: WorkdayModule,
): Record<string, unknown> {
	const flat = flattenRecord(record);
	const standard: Record<string, unknown> = {};

	if (module === 'recruiting') {
		standard['job_requisition_id'] =
			record['id'] ?? record['workdayID'] ?? readNestedId(record['jobRequisition']);
		standard['title'] =
			record['title'] ?? record['descriptor'] ?? readNestedDescriptor(record['jobRequisition']);
		standard['location'] = readNestedDescriptor(record['location']) ?? record['location'];
		standard['candidate_id'] = readNestedId(record['candidate']);
		standard['application_status'] =
			record['applicationStatus'] ?? record['status'] ?? record['stage'];
	} else if (module === 'onboarding') {
		standard['employee_id'] =
			record['id'] ?? record['workdayID'] ?? readNestedId(record['worker']);
		standard['name'] =
			record['descriptor'] ?? record['fullName'] ?? readNestedDescriptor(record['worker']);
		standard['hire_date'] = record['hireDate'] ?? record['createdMoment'];
		standard['status'] = record['status'] ?? record['workerStatus'];
	} else if (module === 'hr_services_time_tracking') {
		standard['case_id'] = record['id'] ?? record['workdayID'];
		standard['employee_id'] =
			readNestedId(record['worker']) ?? readNestedId(record['employee']) ?? record['workerId'];
		standard['description'] =
			record['description'] ?? record['descriptor'] ?? record['subject'];
		standard['status'] = record['status'];
		standard['time_entry_id'] = record['id'] ?? record['timeEntryId'];
		standard['date'] = record['date'] ?? record['entryDate'] ?? record['timeBlockDate'];
		standard['hours'] = record['hours'] ?? record['quantity'] ?? record['reportedQuantity'];
	}

	return { ...flat, ...standard };
}

export function formatWorkdayOutputs(
	records: Record<string, unknown>[],
	module: WorkdayModule,
): Record<string, unknown>[] {
	return records.map((record) => formatWorkdayOutput(record, module));
}

export function getRecordTimestamp(
	record: Record<string, unknown>,
	preferredField?: string,
): string | undefined {
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

function readNestedId(value: unknown): unknown {
	if (value === null || value === undefined) {
		return null;
	}
	if (typeof value === 'object' && value !== null && 'id' in value) {
		return (value as { id: unknown }).id;
	}
	return value;
}

function readNestedDescriptor(value: unknown): unknown {
	if (value === null || value === undefined) {
		return null;
	}
	if (typeof value === 'object' && value !== null) {
		const obj = value as Record<string, unknown>;
		return obj['descriptor'] ?? obj['name'] ?? obj['fullName'] ?? null;
	}
	return value;
}

export type WorkdayModule =
	| 'recruiting'
	| 'onboarding'
	| 'hr_services_time_tracking';
