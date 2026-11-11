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

function stringsAt({ value, key }: { value: unknown; key: string }): string[] {
	if (!isRecord(value)) {
		return [];
	}
	const inner = value[key];
	return Array.isArray(inner) ? inner.filter((item): item is string => typeof item === 'string') : [];
}

function numberAt({ value, key }: { value: unknown; key: string }): number | undefined {
	if (!isRecord(value)) {
		return undefined;
	}
	const inner = value[key];
	return typeof inner === 'number' && Number.isFinite(inner) ? inner : undefined;
}

export const ccData = { isRecord, recordAt, recordsAt, textAt, stringsAt, numberAt };

export type UnknownRecord = Record<string, unknown>;

export type CcQueryValue = string | number | boolean | undefined | null;

export type CcQuery = Record<string, CcQueryValue>;

export type CcMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type CcScope = 'contact_data' | 'campaign_data' | 'account_read';

export type CcPage = {
	items: UnknownRecord[];
	nextCursor: string | null;
	body: unknown;
};

export type ContactChanges = {
	first_name?: string;
	last_name?: string;
	job_title?: string;
	company_name?: string;
	birthday_month?: number;
	birthday_day?: number;
	anniversary?: string;
	phone?: { phone_number: string; kind: string };
	street_address?: StreetAddressInput;
	custom_fields?: CustomFieldValue[];
	add_list_ids?: string[];
};

export type StreetAddressInput = {
	kind: string;
	street?: string;
	city?: string;
	state?: string;
	postal_code?: string;
	country?: string;
};

export type CustomFieldValue = {
	custom_field_id: string;
	value: string;
};

export type ActivityKind = 'add_list_memberships' | 'remove_list_memberships' | 'contacts_taggings_add' | 'contacts_taggings_remove';
