import { TableField } from './types';

const NUMERIC_TYPES = ['NUMBER', 'CURRENCY', 'PERCENT', 'RATING', 'AUTONUMBER', 'DURATION'];
const LIST_OPERATORS = ['IS_ONE_OF', 'IS_NOT_ONE_OF', 'HAS_ANY_OF', 'HAS_ALL_OF', 'HAS_NONE_OF'];
const UNARY_OPERATORS = ['IS_EMPTY', 'IS_NOT_EMPTY'];
const RANGE_OPERATORS = ['IS_BETWEEN', 'IS_NOT_BETWEEN'];
const MAX_LISTED_FIELD_NAMES = 25;
const SYSTEM_SORT_FIELDS = ['created_at', 'updated_at'];

function resolveField({ fields, reference }: { fields: TableField[]; reference: string | undefined | null }): TableField {
	const trimmed = typeof reference === 'string' ? reference.trim() : '';
	if (!trimmed) {
		throw new Error('Field is required: give a field ID or field name from the table.');
	}
	const byId = fields.find((field) => field.id === trimmed);
	if (byId) {
		return byId;
	}
	const byName = fields.filter((field) => field.name === trimmed);
	if (byName.length === 1) {
		return byName[0];
	}
	const byNameInsensitive = fields.filter((field) => field.name.toLowerCase() === trimmed.toLowerCase());
	if (byNameInsensitive.length === 1) {
		return byNameInsensitive[0];
	}
	const available = fields
		.slice(0, MAX_LISTED_FIELD_NAMES)
		.map((field) => field.name)
		.join(', ');
	if (byName.length > 1 || byNameInsensitive.length > 1) {
		throw new Error(`More than one field is named "${trimmed}". Use the field ID instead (see the Get Table action).`);
	}
	throw new Error(`Field "${trimmed}" was not found in this table. Available fields: ${available}`);
}

function resolveSortField({ fields, reference }: { fields: TableField[]; reference: string }): string {
	const lowered = reference.trim().toLowerCase();
	if (SYSTEM_SORT_FIELDS.includes(lowered) && !fields.some((field) => field.id === reference.trim() || field.name === reference.trim())) {
		return lowered;
	}
	return resolveField({ fields, reference }).id;
}

function toText(value: unknown): string {
	if (value === undefined || value === null) {
		return '';
	}
	return typeof value === 'string' ? value : String(value);
}

function coerceScalar({ field, value }: { field: TableField; value: unknown }): string | number | boolean {
	if (typeof value === 'number' || typeof value === 'boolean') {
		return value;
	}
	const text = toText(value).trim();
	if (NUMERIC_TYPES.includes(field.type)) {
		const parsed = Number(text);
		if (text.length === 0 || Number.isNaN(parsed)) {
			throw new Error(`Field "${field.name}" is a number field, so the value must be a number (got "${text}").`);
		}
		return parsed;
	}
	if (field.type === 'CHECKBOX') {
		const lowered = text.toLowerCase();
		if (lowered !== 'true' && lowered !== 'false') {
			throw new Error(`Field "${field.name}" is a checkbox, so the value must be "true" or "false" (got "${text}").`);
		}
		return lowered === 'true';
	}
	return toText(value);
}

function toList(value: unknown): string[] {
	const items = Array.isArray(value) ? value.map(toText) : toText(value).split(',');
	return items.map((item) => item.trim()).filter((item) => item.length > 0);
}

function buildCondition({ field, operator, value, upperBound }: BuildConditionParams): SoftrCondition {
	if (UNARY_OPERATORS.includes(operator)) {
		return { operator, leftSide: field.id };
	}
	if (RANGE_OPERATORS.includes(operator)) {
		if (isBlank(value) || isBlank(upperBound)) {
			throw new Error(`${operator} on field "${field.name}" needs both a value (lower bound) and an upper bound.`);
		}
		return {
			operator,
			leftSide: field.id,
			lowerBound: coerceScalar({ field, value }),
			upperBound: coerceScalar({ field, value: upperBound }),
		};
	}
	if (LIST_OPERATORS.includes(operator)) {
		const list = toList(value);
		if (list.length === 0) {
			throw new Error(`${operator} on field "${field.name}" needs at least one value (comma-separated).`);
		}
		return { operator, leftSide: field.id, rightSide: list };
	}
	if (isBlank(value)) {
		throw new Error(`${operator} on field "${field.name}" needs a value.`);
	}
	return { operator, leftSide: field.id, rightSide: coerceScalar({ field, value }) };
}

function isBlank(value: unknown): boolean {
	return value === undefined || value === null || (typeof value === 'string' && value.trim().length === 0);
}

const OPERATOR_OPTIONS = [
	{ label: 'Is (equals)', value: 'IS' },
	{ label: 'Is not', value: 'IS_NOT' },
	{ label: 'Contains', value: 'CONTAINS' },
	{ label: 'Does not contain', value: 'DOES_NOT_CONTAIN' },
	{ label: 'Starts with', value: 'STARTS_WITH' },
	{ label: 'Does not start with', value: 'DOES_NOT_START_WITH' },
	{ label: 'Ends with', value: 'ENDS_WITH' },
	{ label: 'Does not end with', value: 'DOES_NOT_END_WITH' },
	{ label: 'Greater than', value: 'GREATER_THAN' },
	{ label: 'Greater than or equal', value: 'GREATER_THAN_OR_EQUALS' },
	{ label: 'Less than', value: 'LESS_THAN' },
	{ label: 'Less than or equal', value: 'LESS_THAN_OR_EQUALS' },
	{ label: 'Is between (inclusive)', value: 'IS_BETWEEN' },
	{ label: 'Is not between', value: 'IS_NOT_BETWEEN' },
	{ label: 'Is one of (comma-separated)', value: 'IS_ONE_OF' },
	{ label: 'Is not one of (comma-separated)', value: 'IS_NOT_ONE_OF' },
	{ label: 'Has any of (comma-separated)', value: 'HAS_ANY_OF' },
	{ label: 'Has all of (comma-separated)', value: 'HAS_ALL_OF' },
	{ label: 'Has none of (comma-separated)', value: 'HAS_NONE_OF' },
	{ label: 'Is empty', value: 'IS_EMPTY' },
	{ label: 'Is not empty', value: 'IS_NOT_EMPTY' },
];

type BuildConditionParams = {
	field: TableField;
	operator: string;
	value: unknown;
	upperBound?: unknown;
};

type SoftrCondition = {
	operator: string;
	leftSide: string;
	rightSide?: string | number | boolean | string[];
	lowerBound?: string | number | boolean;
	upperBound?: string | number | boolean;
};

export const softrSearch = {
	resolveField,
	resolveSortField,
	buildCondition,
	coerceScalar,
	operatorOptions: OPERATOR_OPTIONS,
	operatorValues: OPERATOR_OPTIONS.map((option) => option.value),
};

export type { SoftrCondition };
