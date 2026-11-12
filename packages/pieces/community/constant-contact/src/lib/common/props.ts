import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../auth';
import { ccClient } from './client';
import { ContactChanges, CustomFieldValue, StreetAddressInput, UnknownRecord, ccData } from './types';

function optionalText(value: unknown): string | undefined {
	if (value === undefined || value === null) {
		return undefined;
	}
	if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
		return undefined;
	}
	const text = String(value).trim();
	return text === '' ? undefined : text;
}

function textWithin({ value, label, max }: { value: unknown; label: string; max: number }): string | undefined {
	const text = optionalText(value);
	if (text !== undefined && text.length > max) {
		throw new Error(`${label} can be at most ${max} characters (got ${text.length}).`);
	}
	return text;
}

function wholeNumber({ value, label, min, max }: { value: unknown; label: string; min: number; max: number }): number | undefined {
	const text = optionalText(value);
	if (text === undefined) {
		return undefined;
	}
	const parsed = Number(text);
	if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
		throw new Error(`${label} must be a whole number from ${min} to ${max} (got "${text.slice(0, 20)}").`);
	}
	return parsed;
}

function birthday({ month, day }: { month: unknown; day: unknown }): { birthday_month?: number; birthday_day?: number } {
	const birthdayMonth = wholeNumber({ value: month, label: 'Birthday Month', min: 1, max: 12 });
	const birthdayDay = wholeNumber({ value: day, label: 'Birthday Day', min: 1, max: 31 });
	if ((birthdayMonth === undefined) !== (birthdayDay === undefined)) {
		throw new Error('Birthday Month and Birthday Day must be given together.');
	}
	if (birthdayMonth === undefined || birthdayDay === undefined) {
		return {};
	}
	if (birthdayDay > DAYS_IN_MONTH[birthdayMonth - 1]) {
		throw new Error(`Birthday Day ${birthdayDay} does not exist in month ${birthdayMonth}.`);
	}
	return { birthday_month: birthdayMonth, birthday_day: birthdayDay };
}

function anniversary(value: unknown): string | undefined {
	const text = optionalText(value);
	if (text === undefined) {
		return undefined;
	}
	if (!ANNIVERSARY.test(text)) {
		throw new Error(`Anniversary must be a date such as 2020-06-15 or 06/15/2020 (got "${text.slice(0, 20)}").`);
	}
	return text;
}

function choice({ value, label, allowed }: { value: unknown; label: string; allowed: readonly string[] }): string | undefined {
	const text = optionalText(value)?.toLowerCase();
	if (text === undefined) {
		return undefined;
	}
	if (!allowed.includes(text)) {
		throw new Error(`${label} must be one of ${allowed.join(', ')} (got "${text.slice(0, 20)}").`);
	}
	return text;
}

function phone({ number, kind }: { number: unknown; kind: unknown }): { phone_number: string; kind: string } | undefined {
	const phoneNumber = textWithin({ value: number, label: 'Phone Number', max: 25 });
	const phoneKind = choice({ value: kind, label: 'Phone Type', allowed: PHONE_KINDS });
	if (phoneNumber === undefined) {
		return undefined;
	}
	return { phone_number: phoneNumber, kind: phoneKind ?? 'other' };
}

function streetAddress(props: Record<string, unknown>): StreetAddressInput | undefined {
	const fields = {
		street: textWithin({ value: props['street'], label: 'Street', max: 255 }),
		city: textWithin({ value: props['city'], label: 'City', max: 50 }),
		state: textWithin({ value: props['state'], label: 'State', max: 50 }),
		postal_code: textWithin({ value: props['postal_code'], label: 'Postal Code', max: 50 }),
		country: textWithin({ value: props['country'], label: 'Country', max: 50 }),
	};
	const kind = choice({ value: props['address_kind'], label: 'Address Type', allowed: ADDRESS_KINDS });
	if (Object.values(fields).every((field) => field === undefined)) {
		return undefined;
	}
	return { kind: kind ?? 'home', ...fields };
}

function customFieldValue({ fieldId, raw, label }: { fieldId: string; raw: unknown; label: string }): CustomFieldValue | undefined {
	if (!ccClient.isUuid(fieldId)) {
		throw new Error(`${label}: "${fieldId.slice(0, 60)}" is not a custom field ID. Use the custom_field_id values from List Custom Fields.`);
	}
	if (raw === undefined || raw === null || raw === '') {
		return undefined;
	}
	if (typeof raw !== 'string' && typeof raw !== 'number' && typeof raw !== 'boolean') {
		throw new Error(`${label}: the value for ${fieldId} must be text, a number or true/false.`);
	}
	const text = String(raw);
	if (text.length > 255) {
		throw new Error(`${label}: the value for ${fieldId} can be at most 255 characters.`);
	}
	return { custom_field_id: fieldId.toLowerCase(), value: text };
}

function customFieldsFromJson({ value, label }: { value: unknown; label: string }): CustomFieldValue[] {
	if (value === undefined || value === null || value === '') {
		return [];
	}
	let parsed: unknown = value;
	if (typeof value === 'string') {
		try {
			parsed = JSON.parse(value);
		} catch {
			throw new Error(`${label} must be a JSON object keyed by custom field ID, such as {"<custom_field_id>": "Gold"}.`);
		}
	}
	if (!ccData.isRecord(parsed)) {
		throw new Error(`${label} must be a JSON object keyed by custom field ID, such as {"<custom_field_id>": "Gold"}.`);
	}
	return Object.entries(parsed)
		.map(([fieldId, raw]) => customFieldValue({ fieldId, raw, label }))
		.filter((entry): entry is CustomFieldValue => entry !== undefined);
}

function customFieldsFromDynamic(value: unknown): CustomFieldValue[] {
	if (!ccData.isRecord(value)) {
		return [];
	}
	return Object.entries(value)
		.map(([fieldId, raw]) => customFieldValue({ fieldId, raw, label: 'Custom Fields' }))
		.filter((entry): entry is CustomFieldValue => entry !== undefined);
}

function mergeCustomFields({ json, dynamic }: { json: CustomFieldValue[]; dynamic: CustomFieldValue[] }): CustomFieldValue[] {
	const dynamicIds = new Set(dynamic.map((entry) => entry.custom_field_id));
	return [...json.filter((entry) => !dynamicIds.has(entry.custom_field_id)), ...dynamic];
}

function textList(value: unknown): string[] {
	if (value === undefined || value === null || value === '') {
		return [];
	}
	const raw: unknown[] = Array.isArray(value) ? value : String(value).split(',');
	return raw.map((item) => optionalText(item)).filter((item): item is string => item !== undefined);
}

function idList({ value, label, max, required }: { value: unknown; label: string; max: number; required: boolean }): string[] {
	const ids = [...new Set(textList(value).map((id) => id.toLowerCase()))];
	const invalid = ids.find((id) => !ccClient.isUuid(id));
	if (invalid !== undefined) {
		throw new Error(`${label}: "${invalid.slice(0, 60)}" is not a Constant Contact ID (UUID).`);
	}
	if (required && ids.length === 0) {
		throw new Error(`${label} is required.`);
	}
	if (ids.length > max) {
		throw new Error(`${label} accepts at most ${max} IDs (got ${ids.length}).`);
	}
	return ids;
}

function contactChanges(props: Record<string, unknown>): ContactChanges {
	const changes: ContactChanges = {
		first_name: textWithin({ value: props['first_name'], label: 'First Name', max: 50 }),
		last_name: textWithin({ value: props['last_name'], label: 'Last Name', max: 50 }),
		job_title: textWithin({ value: props['job_title'], label: 'Job Title', max: 50 }),
		company_name: textWithin({ value: props['company_name'], label: 'Company Name', max: 50 }),
		...birthday({ month: props['birthday_month'], day: props['birthday_day'] }),
		anniversary: anniversary(props['anniversary']),
		phone: phone({ number: props['phone_number'], kind: props['phone_kind'] }),
		street_address: streetAddress(props),
	};
	return changes;
}

function hasChanges(changes: ContactChanges): boolean {
	return Object.values(changes).some((value) => value !== undefined && !(Array.isArray(value) && value.length === 0));
}

async function listOptions({ accessToken, key, path, idKey }: { accessToken: string; key: string; path: string; idKey: string }): Promise<{ label: string; value: string }[]> {
	const items = await ccClient.listAll({ accessToken, path, key, operation: `load ${key}`, query: { limit: DROPDOWN_PAGE_SIZE }, maxItems: DROPDOWN_MAX_ITEMS });
	return items
		.map((item: UnknownRecord) => ({ label: ccData.textAt({ value: item, key: 'name' }) ?? '', value: ccData.textAt({ value: item, key: idKey }) ?? '' }))
		.filter((option) => option.value !== '')
		.map((option) => ({ ...option, label: option.label === '' ? option.value : option.label }));
}

async function dropdownState({ auth, load, noun }: { auth: unknown; load: (accessToken: string) => Promise<{ label: string; value: string }[]>; noun: string }) {
	const accessToken = accessTokenOf(auth);
	if (accessToken === undefined) {
		return { disabled: true, options: [], placeholder: 'Connect Constant Contact first' };
	}
	try {
		const options = await load(accessToken);
		return { disabled: false, options, placeholder: options.length === 0 ? `No ${noun} found in this Constant Contact account` : `Select ${noun}` };
	} catch (error) {
		return { disabled: true, options: [], placeholder: `Could not load ${noun}: ${error instanceof Error ? error.message.slice(0, 200) : 'unknown error'}` };
	}
}

function accessTokenOf(auth: unknown): string | undefined {
	const token = ccData.textAt({ value: auth, key: 'access_token' });
	return token === undefined || token.trim() === '' ? undefined : token;
}

function listOptionsFor(accessToken: string) {
	return listOptions({ accessToken, key: 'lists', path: '/contact_lists', idKey: 'list_id' });
}

function tagOptionsFor(accessToken: string) {
	return listOptions({ accessToken, key: 'tags', path: '/contact_tags', idKey: 'tag_id' });
}

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const ANNIVERSARY = /^(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4})$/;
const PHONE_KINDS: readonly string[] = ['home', 'work', 'mobile', 'other'];
const ADDRESS_KINDS: readonly string[] = ['home', 'work', 'other'];
const DROPDOWN_PAGE_SIZE = 500;
const DROPDOWN_MAX_ITEMS = 5000;

export const ccInput = {
	optionalText,
	textWithin,
	wholeNumber,
	birthday,
	anniversary,
	choice,
	phone,
	streetAddress,
	customFieldsFromJson,
	customFieldsFromDynamic,
	mergeCustomFields,
	textList,
	idList,
	contactChanges,
	hasChanges,
	accessTokenOf,
};

export const ccProps = {
	contactRef: ({ displayName, description }: { displayName: string; description: string }) =>
		Property.ShortText({ displayName, description, required: true }),
	listsMulti: ({ displayName, description, required }: { displayName: string; description: string; required: boolean }) =>
		Property.MultiSelectDropdown({
			auth: constantContactAuth,
			displayName,
			description,
			required,
			refreshers: [],
			options: async ({ auth }) => dropdownState({ auth, load: listOptionsFor, noun: 'lists' }),
		}),
	listSingle: ({ displayName, description }: { displayName: string; description: string }) =>
		Property.Dropdown({
			auth: constantContactAuth,
			displayName,
			description,
			required: true,
			refreshers: [],
			options: async ({ auth }) => dropdownState({ auth, load: listOptionsFor, noun: 'a list' }),
		}),
	tagSingle: ({ displayName, description }: { displayName: string; description: string }) =>
		Property.Dropdown({
			auth: constantContactAuth,
			displayName,
			description,
			required: true,
			refreshers: [],
			options: async ({ auth }) => dropdownState({ auth, load: tagOptionsFor, noun: 'a tag' }),
		}),
	customFields: () =>
		Property.DynamicProperties({
			auth: constantContactAuth,
			displayName: 'Custom Fields',
			description: 'Values for your Constant Contact custom fields. Leave a field empty to keep its current value.',
			required: false,
			refreshers: [],
			props: async ({ auth }) => {
				const accessToken = accessTokenOf(auth);
				if (accessToken === undefined) {
					return {};
				}
				const fields = await ccClient.listAll({
					accessToken,
					path: '/contact_custom_fields',
					key: 'custom_fields',
					operation: 'load custom fields',
					query: { limit: 100 },
					maxItems: 1000,
				});
				const entries = fields
					.map((field) => ({ id: ccData.textAt({ value: field, key: 'custom_field_id' }), label: ccData.textAt({ value: field, key: 'label' }), type: ccData.textAt({ value: field, key: 'type' }) }))
					.filter((field): field is { id: string; label: string | undefined; type: string | undefined } => field.id !== undefined)
					.map((field) => [
						field.id,
						Property.ShortText({
							displayName: field.label ?? field.id,
							description: field.type === undefined ? undefined : `Type: ${field.type}`,
							required: false,
						}),
					]);
				const result: DynamicPropsValue = Object.fromEntries(entries);
				return result;
			},
		}),
	customFieldsJson: () =>
		Property.Json({
			displayName: 'Custom Fields (JSON by ID)',
			description:
				'Optional JSON object keyed by custom field ID (UUID), such as {"1618ae62-4752-11e9-9c8a-fa163e6b01c1": "Gold"}. Values above win over this object for the same field.',
			required: false,
		}),
	phoneKind: () =>
		Property.StaticDropdown<string>({
			displayName: 'Phone Type',
			description: 'The kind of phone number. Defaults to other.',
			required: false,
			options: { disabled: false, options: PHONE_KINDS.map((kind) => ({ label: kind.charAt(0).toUpperCase() + kind.slice(1), value: kind })) },
		}),
	addressKind: () =>
		Property.StaticDropdown<string>({
			displayName: 'Address Type',
			description: 'The kind of street address. Defaults to home. Used only when an address field is filled in.',
			required: false,
			options: { disabled: false, options: ADDRESS_KINDS.map((kind) => ({ label: kind.charAt(0).toUpperCase() + kind.slice(1), value: kind })) },
		}),
	birthdayMonth: () => Property.Number({ displayName: 'Birthday Month', description: '1 to 12. Give together with Birthday Day.', required: false }),
	birthdayDay: () => Property.Number({ displayName: 'Birthday Day', description: '1 to 31. Give together with Birthday Month.', required: false }),
	anniversary: () => Property.ShortText({ displayName: 'Anniversary', description: 'A date such as 2020-06-15 or 06/15/2020.', required: false }),
	text: ({ displayName, description }: { displayName: string; description: string }) => Property.ShortText({ displayName, description, required: false }),
};
