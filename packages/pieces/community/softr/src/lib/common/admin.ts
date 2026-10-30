import { Property } from '@activepieces/pieces-framework';

const FIELD_TYPES = [
	'SINGLE_LINE_TEXT',
	'LONG_TEXT',
	'NUMBER',
	'CURRENCY',
	'PERCENT',
	'RATING',
	'CHECKBOX',
	'DATETIME',
	'DURATION',
	'EMAIL',
	'URL',
	'PHONE',
	'SELECT',
	'ATTACHMENT',
	'LINKED_RECORD',
	'USER',
	'LOOKUP',
	'ROLLUP',
	'FORMULA',
	'CREATED_AT',
	'UPDATED_AT',
	'CREATED_BY',
	'UPDATED_BY',
	'AUTONUMBER',
	'RECORD_ID',
];

function requireId({ value, label }: { value: unknown; label: string }): string {
	const text = typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
	if (text.length === 0) {
		throw new Error(`${label} is required.`);
	}
	return text;
}

function optionalText(value: unknown): string | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function parseOptions({ value, label }: { value: unknown; label: string }): Record<string, unknown> | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	const parsed: unknown = typeof value === 'string' ? safeParse({ text: value, label }) : value;
	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
		throw new Error(`${label} must be a JSON object, e.g. {"choices":[{"label":"Open"}]}.`);
	}
	return Object.fromEntries(Object.entries(parsed));
}

function safeParse({ text, label }: { text: string; label: string }): unknown {
	try {
		return JSON.parse(text);
	} catch {
		throw new Error(`${label} is not valid JSON.`);
	}
}

function readFieldType(value: unknown): string {
	const type = typeof value === 'string' ? value.trim().toUpperCase() : '';
	if (!FIELD_TYPES.includes(type)) {
		throw new Error(
			`Field type "${String(value ?? '')}" cannot be created through the Softr API. Use one of: ${FIELD_TYPES.join(', ')}. For a date-only field use DATETIME with options {"precision":"DATE"}.`,
		);
	}
	return type;
}

function buildNameDescriptionUpdate({ name, description, clearDescription }: NameDescriptionInput): Record<string, string> {
	const body: Record<string, string> = {};
	const trimmedName = optionalText(name);
	if (trimmedName !== undefined) {
		body['name'] = trimmedName;
	}
	if (clearDescription === true) {
		body['description'] = '';
	} else if (typeof description === 'string' && description.length > 0) {
		body['description'] = description;
	}
	if (Object.keys(body).length === 0) {
		throw new Error('Provide a new name or a new description.');
	}
	return body;
}

const fieldTypeDropdown = ({ required }: { required: boolean }) =>
	Property.StaticDropdown({
		displayName: 'Field Type',
		required,
		options: { options: FIELD_TYPES.map((type) => ({ label: type, value: type })) },
	});

type NameDescriptionInput = {
	name: unknown;
	description: unknown;
	clearDescription: unknown;
};

export const softrAdmin = {
	requireId,
	optionalText,
	parseOptions,
	readFieldType,
	buildNameDescriptionUpdate,
	fieldTypeDropdown,
	fieldTypes: FIELD_TYPES,
};
