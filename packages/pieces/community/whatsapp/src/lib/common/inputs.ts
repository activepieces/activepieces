function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseIfJsonString(value: unknown): unknown {
	if (typeof value !== 'string') return value;
	const trimmed = value.trim();
	if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) return value;
	try {
		return JSON.parse(trimmed);
	} catch {
		return value;
	}
}

function asRecords(value: unknown): Record<string, unknown>[] {
	const parsed = parseIfJsonString(value);
	if (!Array.isArray(parsed)) return [];
	return parsed.filter(isRecord);
}

function asStrings(value: unknown): string[] {
	const parsed = parseIfJsonString(value);
	if (!Array.isArray(parsed)) return [];
	return parsed.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

function assertMaxLength({ value, maxLength, label }: AssertMaxLengthParams): void {
	if (value && value.length > maxLength) {
		throw new Error(`${label} must be at most ${maxLength} characters (got ${value.length}).`);
	}
}

function assertUnique({ values, label }: AssertUniqueParams): void {
	if (new Set(values).size !== values.length) {
		throw new Error(`${label} must be unique.`);
	}
}

function optionalString({ record, key, label, maxLength }: OptionalFieldParams): string | undefined {
	const value = record[key];
	const text = typeof value === 'string' && value.length > 0 ? value : undefined;
	if (maxLength !== undefined) {
		assertMaxLength({ value: text, maxLength, label: label ?? key });
	}
	return text;
}

function requiredString({ record, key, label, maxLength }: RequiredFieldParams): string {
	const value = optionalString({ record, key, label, maxLength });
	if (!value) {
		throw new Error(`${label} is required on every entry.`);
	}
	return value;
}

export const inputUtils = {
	isRecord,
	asRecords,
	asStrings,
	assertMaxLength,
	assertUnique,
	optionalString,
	requiredString,
};

type AssertMaxLengthParams = { value: string | undefined; maxLength: number; label: string };
type AssertUniqueParams = { values: string[]; label: string };
type OptionalFieldParams = { record: Record<string, unknown>; key: string; label?: string; maxLength?: number };
type RequiredFieldParams = { record: Record<string, unknown>; key: string; label: string; maxLength?: number };
