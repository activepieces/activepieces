import { CUSTOM_FIELD_TYPE } from './constants';

function isRecord(value: unknown): value is UnknownRecord {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function recordAt({ value, key }: { value: unknown; key: string }): UnknownRecord | undefined {
	if (!isRecord(value)) {
		return undefined;
	}
	const inner = value[key];
	return isRecord(inner) ? inner : undefined;
}

function recordsAt({ value, key }: { value: unknown; key: string }): UnknownRecord[] {
	if (!isRecord(value)) {
		return [];
	}
	const inner = value[key];
	return Array.isArray(inner) ? inner.filter(isRecord) : [];
}

function textAt({ value, key }: { value: unknown; key: string }): string | undefined {
	if (!isRecord(value)) {
		return undefined;
	}
	const inner = value[key];
	if (typeof inner === 'string') {
		return inner;
	}
	if (typeof inner === 'number' && Number.isFinite(inner)) {
		return String(inner);
	}
	return undefined;
}

function pick({ record, keys }: { record: UnknownRecord | undefined; keys: readonly string[] }): UnknownRecord {
	const picked: UnknownRecord = {};
	if (!record) {
		return picked;
	}
	for (const key of keys) {
		if (record[key] !== undefined) {
			picked[key] = record[key];
		}
	}
	return picked;
}

export const acData = { isRecord, recordAt, recordsAt, textAt, pick };

export type UnknownRecord = Record<string, unknown>;

export type CustomFieldValue = string | number | boolean | string[];

export type CreateWebhookRequest = {
	name: string;
	url: string;
	events: string[];
	sources: string[];
	listid?: string;
};

export type CreateWebhookResponse = {
	webhook: {
		name: string;
		url: string;
		events: string[];
		sources: string[];
		listid: string;
		cdate: string;
		state: string;
		id: string;
	};
};

export type ContactList = {
	id: string;
	name: string;
};

export type CreateAccountRequest = {
	name: string;
	accountUrl?: string;
	fields?: {
		customFieldId: number;
		fieldValue: unknown;
	}[];
};

export type CreateContactRequest = {
	email: string;
	firstName?: string;
	lastName?: string;
	phone?: string;
	fieldValues: {
		field: string;
		value: unknown;
	}[];
};

export type AccountCustomFieldsResponse = {
	id: string;
	fieldLabel: string;
	fieldType: CUSTOM_FIELD_TYPE;
	fieldOptions?: string[];
	fieldDefaultCurrency?: string;
	fieldDefault?: number | string | string[];
};

export type ContactCustomField = {
	id: string;
	title: string;
	type: CUSTOM_FIELD_TYPE;
	perstag?: string;
};

export type ContactFieldOption = {
	field: string;
	value: string;
	label: string;
	id: string;
};

export type ContactCustomFieldsResponse = {
	fieldOptions: ContactFieldOption[];
	fields: ContactCustomField[];
};

export type ListPage = {
	items: UnknownRecord[];
	total: number;
	offset: number;
	limit: number;
	hasMore: boolean;
};
