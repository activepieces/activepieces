import { Property } from '@activepieces/pieces-framework';
import { normalizeRecord } from './client';
import { AttioRecordResponse } from './types';

function objectProp() {
	return Property.ShortText({
		displayName: 'Object',
		description: 'Object slug or ID, e.g. `people`, `companies`, `deals`. Use List Objects to find custom objects.',
		required: true,
	});
}

function recordIdProp({ description }: { description?: string } = {}) {
	return Property.ShortText({
		displayName: 'Record ID',
		description: description ?? 'Record ID (`id.record_id`), from Query Records, Search Records or Create Record.',
		required: true,
	});
}

function listProp() {
	return Property.ShortText({
		displayName: 'List',
		description: 'List slug or ID. Use List Lists to find it.',
		required: true,
	});
}

function entryIdProp() {
	return Property.ShortText({
		displayName: 'Entry ID',
		description: 'List entry ID (`id.entry_id`), from Query List Entries or Create List Entry.',
		required: true,
	});
}

function attributeProp() {
	return Property.ShortText({
		displayName: 'Attribute',
		description: 'Attribute slug or ID. Use List Attributes to find it.',
		required: true,
	});
}

function targetProp() {
	return Property.StaticDropdown({
		displayName: 'Target',
		description: 'Whether the attribute belongs to an object or a list.',
		required: true,
		options: {
			disabled: false,
			options: [
				{ label: 'Object', value: 'objects' },
				{ label: 'List', value: 'lists' },
			],
		},
	});
}

function identifierProp() {
	return Property.ShortText({
		displayName: 'Object or List',
		description: 'Slug or ID of the object or list the attribute belongs to.',
		required: true,
	});
}

function valuesProp<R extends boolean>({ displayName, description, required }: { displayName: string; description: string; required: R }) {
	return Property.Json({ displayName, description, required });
}

function limitProp({ max }: { max: number }) {
	return Property.Number({
		displayName: 'Limit',
		description: `Maximum number of results to return (up to ${max}).`,
		required: false,
	});
}

function offsetProp() {
	return Property.Number({
		displayName: 'Offset',
		description: 'Number of results to skip, for pagination.',
		required: false,
	});
}

function cursorProp() {
	return Property.ShortText({
		displayName: 'Cursor',
		description: 'Pagination cursor from the previous response (`pagination.next_cursor`).',
		required: false,
	});
}

function optionalBooleanProp({ displayName, description }: { displayName: string; description: string }) {
	return Property.StaticDropdown({
		displayName,
		description,
		required: false,
		options: {
			disabled: false,
			options: [
				{ label: 'Yes', value: 'true' },
				{ label: 'No', value: 'false' },
			],
		},
	});
}

function sortsProp() {
	return Property.Array({
		displayName: 'Sorts',
		description: 'Sort order, applied in sequence.',
		required: false,
		properties: {
			attribute: Property.ShortText({ displayName: 'Attribute', description: 'Attribute slug or ID to sort by.', required: true }),
			field: Property.ShortText({ displayName: 'Field', description: 'Optional sub-field, e.g. `last_name` for a name attribute.', required: false }),
			direction: Property.StaticDropdown({
				displayName: 'Direction',
				required: true,
				options: {
					disabled: false,
					options: [
						{ label: 'Ascending', value: 'asc' },
						{ label: 'Descending', value: 'desc' },
					],
				},
			}),
		},
	});
}

function linkedRecordsProp({ description }: { description: string }) {
	return Property.Array({
		displayName: 'Linked Records',
		description,
		required: false,
		properties: {
			object: Property.ShortText({ displayName: 'Object', description: 'Object slug or ID, e.g. `people`.', required: true }),
			record_id: Property.ShortText({ displayName: 'Record ID', required: true }),
		},
	});
}

function toBoolean(value: string | undefined): boolean | undefined {
	if (value === 'true') return true;
	if (value === 'false') return false;
	return undefined;
}

function compact(input: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}

function nonEmptyFilter(filter: unknown): unknown {
	return isRecord(filter) && Object.keys(filter).length === 0 ? undefined : filter;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function records(items: unknown[] | undefined): Record<string, unknown>[] {
	return (items ?? []).filter(isRecord);
}

function strings(items: unknown[] | undefined): string[] {
	return (items ?? []).filter((item): item is string => typeof item === 'string' && item.trim() !== '');
}

function flattenRecord(record: AttioRecordResponse): Record<string, unknown> {
	return normalizeRecord(record, {});
}

function parseLooseValue(value: unknown): unknown {
	if (typeof value !== 'string') return value;
	try {
		const parsed: unknown = JSON.parse(value);
		return parsed;
	} catch {
		return value;
	}
}

export const attioAi = {
	objectProp,
	recordIdProp,
	listProp,
	entryIdProp,
	attributeProp,
	targetProp,
	identifierProp,
	valuesProp,
	limitProp,
	offsetProp,
	cursorProp,
	optionalBooleanProp,
	sortsProp,
	linkedRecordsProp,
	toBoolean,
	compact,
	nonEmptyFilter,
	isRecord,
	records,
	strings,
	flattenRecord,
	parseLooseValue,
};
