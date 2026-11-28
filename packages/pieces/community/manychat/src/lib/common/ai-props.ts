import { Property } from '@activepieces/pieces-framework';
import { manychatUtils } from './client';
import { manychatInput } from './props';

function yesNoProp({ displayName, description }: { displayName: string; description: string }) {
	return Property.StaticDropdown<string>({
		displayName,
		description,
		required: false,
		options: {
			options: [
				{ label: 'Yes', value: 'yes' },
				{ label: 'No', value: 'no' },
			],
		},
	});
}

function yesNo({ value, label }: { value: unknown; label: string }): boolean | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	if (value === 'yes' || value === true) {
		return true;
	}
	if (value === 'no' || value === false) {
		return false;
	}
	throw new Error(`${label} must be "yes" or "no".`);
}

function oneOf<T extends string>({ value, label, allowed }: { value: unknown; label: string; allowed: readonly T[] }): T | undefined {
	const text = manychatInput.optionalText(value);
	if (text === undefined) {
		return undefined;
	}
	const match = allowed.find((option) => option === text);
	if (match === undefined) {
		throw new Error(`${label} must be one of: ${allowed.join(', ')} (got "${text.slice(0, 50)}").`);
	}
	return match;
}

function requireText({ value, label }: { value: unknown; label: string }): string {
	const text = manychatInput.optionalText(value);
	if (text === undefined) {
		throw new Error(`${label} is required.`);
	}
	return text;
}

function fieldEntries({ value, label }: { value: unknown; label: string }): FieldEntry[] {
	const parsed: unknown = typeof value === 'string' ? parseJson({ text: value, label }) : value;
	if (!Array.isArray(parsed) || parsed.length === 0) {
		throw new Error(`${label} must list at least one field.`);
	}
	if (parsed.length > MAX_FIELDS_PER_CALL) {
		throw new Error(`${label} can hold at most ${MAX_FIELDS_PER_CALL} fields per call (ManyChat limit).`);
	}
	return parsed.map((item, index) => {
		if (!manychatUtils.isRecord(item)) {
			throw new Error(`${label} item ${index + 1} must be an object with "field" and "value".`);
		}
		const field = manychatInput.optionalText(item['field']);
		if (field === undefined) {
			throw new Error(`${label} item ${index + 1} needs a field ID or name.`);
		}
		if (item['value'] === undefined || item['value'] === null) {
			throw new Error(`${label} item ${index + 1} ("${field}") needs a value.`);
		}
		return { field, value: item['value'] };
	});
}

function resolveField({ field, fields }: { field: string; fields: Record<string, unknown>[] }): Record<string, unknown> {
	if (/^\d+$/.test(field)) {
		const byId = fields.find((item) => String(item['id']) === field);
		if (byId !== undefined) {
			return byId;
		}
	}
	const exact = fields.filter((item) => item['name'] === field);
	if (exact.length === 1) {
		return exact[0];
	}
	const loose = fields.filter((item) => typeof item['name'] === 'string' && item['name'].toLowerCase() === field.toLowerCase());
	if (loose.length === 1) {
		return loose[0];
	}
	if (exact.length > 1 || loose.length > 1) {
		throw new Error(`More than one custom field is named "${field}". Use its ID from "List Custom Fields".`);
	}
	throw new Error(`No custom field has the ID or name "${field}". Call "List Custom Fields" to see the available fields.`);
}

function parseJson({ text, label }: { text: string; label: string }): unknown {
	try {
		return JSON.parse(text);
	} catch {
		throw new Error(`${label} must be valid JSON.`);
	}
}

const MAX_FIELDS_PER_CALL = 20;

export const aiProps = {
	yesNo: yesNoProp,
};

export const aiInput = {
	yesNo,
	oneOf,
	requireText,
	fieldEntries,
	resolveField,
};

export const CUSTOM_FIELD_TYPES = ['text', 'number', 'date', 'datetime', 'boolean', 'array'] as const;

export type FieldEntry = { field: string; value: unknown };
