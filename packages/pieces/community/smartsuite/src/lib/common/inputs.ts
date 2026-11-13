import { Property } from '@activepieces/pieces-framework';

function parseJsonValue({ value, label }: { value: unknown; label: string }): unknown {
	if (typeof value !== 'string') {
		return value;
	}
	const text = value.trim();
	if (text.length === 0) {
		return undefined;
	}
	try {
		return JSON.parse(text);
	} catch {
		throw new Error(`${label} must be valid JSON.`);
	}
}

function requireObject({ value, label }: { value: unknown; label: string }): Record<string, unknown> {
	const parsed = parseJsonValue({ value, label });
	if (!isPlainObject(parsed)) {
		throw new Error(`${label} must be a JSON object, for example {"title": "My record"}.`);
	}
	return parsed;
}

function optionalJson({ value, label }: { value: unknown; label: string }): unknown {
	if (value === undefined || value === null) {
		return undefined;
	}
	const parsed = parseJsonValue({ value, label });
	if (isPlainObject(parsed) && Object.keys(parsed).length === 0) {
		return undefined;
	}
	if (Array.isArray(parsed) && parsed.length === 0) {
		return undefined;
	}
	return parsed;
}

function requireObjectArray({ value, label, max }: { value: unknown; label: string; max: number }): Record<string, unknown>[] {
	const parsed = parseJsonValue({ value, label });
	if (!Array.isArray(parsed) || parsed.length === 0) {
		throw new Error(`${label} must be a non-empty JSON array of objects.`);
	}
	if (parsed.length > max) {
		throw new Error(`${label} can hold at most ${max} items per call; got ${parsed.length}.`);
	}
	return parsed.map((item, index) => {
		if (!isPlainObject(item)) {
			throw new Error(`${label} item ${index + 1} must be a JSON object.`);
		}
		return item;
	});
}

function requireIdList({ value, label, max }: { value: unknown; label: string; max: number }): string[] {
	const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
	const ids = raw.map((item) => String(item ?? '').trim()).filter((item) => item.length > 0);
	if (ids.length === 0) {
		throw new Error(`${label} must contain at least one ID.`);
	}
	if (ids.length > max) {
		throw new Error(`${label} can hold at most ${max} IDs per call; got ${ids.length}.`);
	}
	return Array.from(new Set(ids));
}

function requireText({ value, label }: { value: unknown; label: string }): string {
	const text = value === undefined || value === null ? '' : String(value).trim();
	if (text.length === 0) {
		throw new Error(`${label} is required.`);
	}
	return text;
}

function integerInRange({ value, label, min, max, fallback }: { value: unknown; label: string; min: number; max: number; fallback: number }): number {
	if (value === undefined || value === null || value === '') {
		return fallback;
	}
	const number = Number(value);
	if (!Number.isInteger(number) || number < min || number > max) {
		throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
	}
	return number;
}

function plainTextToDoc(text: string): Record<string, unknown> {
	return {
		data: {
			type: 'doc',
			content: text.split(/\r?\n/).map((line) => ({
				type: 'paragraph',
				content: line.length > 0 ? [{ type: 'text', text: line }] : [],
			})),
		},
	};
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const aiProps = {
	solutionId: (required = true) =>
		Property.ShortText({
			displayName: 'Solution ID',
			description: 'The SmartSuite solution ID (24 characters). Get it from List Solutions.',
			required,
		}),
	tableId: () =>
		Property.ShortText({
			displayName: 'Table ID',
			description: 'The SmartSuite table (application) ID. Get it from List Tables.',
			required: true,
		}),
	recordId: () =>
		Property.ShortText({
			displayName: 'Record ID',
			description: 'The record ID. Get it from List Records or a create step.',
			required: true,
		}),
	limit: (fallback: number) =>
		Property.Number({
			displayName: 'Limit',
			description: `How many items to return in one call (1-1000, default ${fallback}).`,
			required: false,
			defaultValue: fallback,
		}),
	offset: () =>
		Property.Number({
			displayName: 'Offset',
			description: 'How many items to skip. Use the previous offset plus the number of items returned to get the next page.',
			required: false,
			defaultValue: 0,
		}),
};

export const smartSuiteInputs = {
	requireObject,
	optionalJson,
	requireObjectArray,
	requireIdList,
	requireText,
	integerInRange,
	plainTextToDoc,
	isPlainObject,
	aiProps,
};
