import { Property } from '@activepieces/pieces-framework';
import { ActiveCampaignClient } from './client';
import { DEAL_STATUS_CODES, DEAL_STATUS_LABELS } from './constants';
import { UnknownRecord, acData } from './types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/;
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:?\d{2})$/;
const DECIMAL = /^(\d{1,13})(?:\.(\d{1,2}))?$/;
const MAX_LIMIT = 100;
const ID_KEYS = new Set([
	'id',
	'contact',
	'list',
	'status',
	'sourceid',
	'tag',
	'account',
	'customFieldId',
	'orgid',
	'relid',
	'assignee',
	'dealTasktype',
	'group',
	'stage',
	'owner',
	'field',
]);

const CONTACT_KEYS = ['id', 'email', 'firstName', 'lastName', 'phone', 'cdate', 'udate', 'orgid'];
const ACCOUNT_KEYS = ['id', 'name', 'accountUrl', 'createdTimestamp', 'updatedTimestamp', 'contactCount', 'dealCount'];
const TASK_KEYS = ['id', 'title', 'note', 'relid', 'reltype', 'duedate', 'edate', 'status', 'assignee', 'dealTasktype', 'cdate'];

function optionalText(value: unknown): string | undefined {
	if (value === undefined || value === null) {
		return undefined;
	}
	const text = String(value).trim();
	return text === '' ? undefined : text;
}

function requireText({ value, label }: { value: unknown; label: string }): string {
	const text = optionalText(value);
	if (text === undefined) {
		throw new Error(`${label} is required.`);
	}
	return text;
}

function numericId({ value, label }: { value: unknown; label: string }): string {
	const text = requireText({ value, label });
	if (!/^\d{1,15}$/.test(text) || Number(text) < 1) {
		throw new Error(`${label} must be a positive whole number (got "${text.slice(0, 50)}").`);
	}
	return text;
}

function optionalNumericId({ value, label }: { value: unknown; label: string }): string | undefined {
	return optionalText(value) === undefined ? undefined : numericId({ value, label });
}

function pageParams({ limit, offset }: { limit: unknown; offset: unknown }): { limit: number; offset: number } {
	const parsedLimit = limit === undefined || limit === null || limit === '' ? 20 : Number(limit);
	const parsedOffset = offset === undefined || offset === null || offset === '' ? 0 : Number(offset);
	if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > MAX_LIMIT) {
		throw new Error(`Limit must be a whole number between 1 and ${MAX_LIMIT}.`);
	}
	if (!Number.isInteger(parsedOffset) || parsedOffset < 0) {
		throw new Error('Offset must be a whole number of 0 or more.');
	}
	return { limit: parsedLimit, offset: parsedOffset };
}

function isoDateTime({ value, label, dateOnlyAt = 'midnight' }: { value: unknown; label: string; dateOnlyAt?: 'midnight' | 'noon' }): string | undefined {
	const text = optionalText(value);
	if (text === undefined) {
		return undefined;
	}
	const candidate = ISO_DATE.test(text) ? `${text}T${dateOnlyAt === 'noon' ? '12' : '00'}:00:00Z` : ISO_LOCAL_DATE_TIME.test(text) ? `${text}Z` : text;
	if (!ISO_DATE_TIME.test(candidate) || Number.isNaN(Date.parse(candidate)) || !isCalendarDateTime(candidate)) {
		throw new Error(`${label} must be an ISO 8601 date or date-time such as 2026-03-01 or 2026-03-01T09:00:00Z (got "${text.slice(0, 50)}").`);
	}
	return new Date(candidate).toISOString();
}

function isCalendarDateTime(text: string): boolean {
	const [year, month, day, hour, minute, second] = [0, 5, 8, 11, 14, 17].map((start) => Number(text.slice(start, start + (start === 0 ? 4 : 2))));
	const calendar = new Date(Date.UTC(year, month - 1, day));
	const sameDay = calendar.getUTCFullYear() === year && calendar.getUTCMonth() === month - 1 && calendar.getUTCDate() === day;
	const secondsValid = text.charAt(16) !== ':' || second < 60;
	return sameDay && hour < 24 && minute < 60 && secondsValid;
}

function idText({ record, keys }: { record: UnknownRecord | undefined; keys: readonly string[] }): UnknownRecord {
	const picked = acData.pick({ record, keys });
	return Object.fromEntries(
		Object.entries(picked).map(([key, value]) => [key, ID_KEYS.has(key) && typeof value === 'number' && Number.isFinite(value) ? String(value) : value]),
	);
}

function dollarsToCents({ value, label }: { value: unknown; label: string }): number {
	const text = requireText({ value, label }).replace(/^\$/, '');
	const match = DECIMAL.exec(text);
	if (!match) {
		throw new Error(`${label} must be a non-negative amount with at most 2 decimals, such as 1500 or 1234.50 (got "${text.slice(0, 50)}").`);
	}
	const whole = Number(match[1]);
	const fraction = Number((match[2] ?? '').padEnd(2, '0'));
	return whole * 100 + fraction;
}

function centsToDecimal(cents: string | undefined): string | undefined {
	if (cents === undefined || !/^-?\d+$/.test(cents)) {
		return undefined;
	}
	const negative = cents.startsWith('-');
	const digits = (negative ? cents.slice(1) : cents).padStart(3, '0');
	return `${negative ? '-' : ''}${digits.slice(0, -2).replace(/^0+(?=\d)/, '')}.${digits.slice(-2)}`;
}

function currencyCode({ value, label }: { value: unknown; label: string }): string | undefined {
	const text = optionalText(value);
	if (text === undefined) {
		return undefined;
	}
	if (!/^[a-z]{3}$/i.test(text)) {
		throw new Error(`${label} must be a 3-letter ISO currency code such as usd or eur (got "${text.slice(0, 20)}").`);
	}
	return text.toLowerCase();
}

function customFieldEntries({ value, label }: { value: unknown; label: string }): CustomFieldEntry[] {
	if (value === undefined || value === null || value === '') {
		return [];
	}
	let parsed: unknown = value;
	if (typeof value === 'string') {
		try {
			parsed = JSON.parse(value);
		} catch {
			throw new Error(`${label} must be a JSON object keyed by custom field ID, such as {"3": "Gold"}.`);
		}
	}
	if (!acData.isRecord(parsed)) {
		throw new Error(`${label} must be a JSON object keyed by custom field ID, such as {"3": "Gold"}.`);
	}
	return Object.entries(parsed).map(([fieldId, fieldValue]) => {
		if (!/^\d{1,15}$/.test(fieldId)) {
			throw new Error(`${label}: "${fieldId.slice(0, 50)}" is not a custom field ID. Use the numeric IDs from the list custom fields action.`);
		}
		if (Array.isArray(fieldValue)) {
			return { fieldId, value: fieldValue.map((item) => String(item)) };
		}
		if (typeof fieldValue === 'string' || typeof fieldValue === 'number' || typeof fieldValue === 'boolean') {
			return { fieldId, value: String(fieldValue) };
		}
		throw new Error(`${label}: the value for field ${fieldId} must be text, a number, true/false or a list of option values.`);
	});
}

function contactFieldValues(entries: CustomFieldEntry[]): { field: string; value: string }[] {
	return entries.map(({ fieldId, value }) => ({
		field: fieldId,
		value: Array.isArray(value) ? (value.length === 0 ? '' : `||${value.join('||')}||`) : value,
	}));
}

function accountFields(entries: CustomFieldEntry[]): { customFieldId: number; fieldValue: string | string[] }[] {
	return entries.map(({ fieldId, value }) => ({ customFieldId: Number(fieldId), fieldValue: value }));
}

async function resolveContactId({ client, value, label }: { client: ActiveCampaignClient; value: unknown; label: string }): Promise<string> {
	const text = requireText({ value, label });
	if (/^\d{1,15}$/.test(text)) {
		return numericId({ value: text, label });
	}
	if (!text.includes('@')) {
		throw new Error(`${label} must be a numeric contact ID or an email address (got "${text.slice(0, 50)}").`);
	}
	const body = await client.get({ path: '/contacts', query: { email: text } });
	const match = acData
		.recordsAt({ value: body, key: 'contacts' })
		.find((contact) => (acData.textAt({ value: contact, key: 'email' }) ?? '').toLowerCase() === text.toLowerCase());
	const id = acData.textAt({ value: match, key: 'id' });
	if (id === undefined) {
		throw new Error(`No ActiveCampaign contact has the email ${text}. Use List Contacts to find the contact, or Create or Update Contact (AI) to add it first.`);
	}
	return id;
}

function dealStatusCode(value: unknown): number | undefined {
	const status = optionalText(value);
	if (status === undefined) {
		return undefined;
	}
	const lower = status.toLowerCase();
	const code = DEAL_STATUS_CODES[lower] ?? (DEAL_STATUS_LABELS[lower] === undefined ? undefined : lower);
	if (code === undefined) {
		throw new Error('Status must be open, won or lost (or the codes 0, 1 or 2).');
	}
	return Number(code);
}

function contactSummary(contact: UnknownRecord | undefined): UnknownRecord {
	return idText({ record: contact, keys: CONTACT_KEYS });
}

function accountCustomFieldValues(account: UnknownRecord | undefined): { fields: UnknownRecord[] } | Record<string, never> {
	if (!Array.isArray(account?.['fields'])) {
		return {};
	}
	return { fields: acData.recordsAt({ value: account, key: 'fields' }).map((record) => idText({ record, keys: ['customFieldId', 'fieldValue'] })) };
}

function accountSummary(account: UnknownRecord | undefined): UnknownRecord {
	return idText({ record: account, keys: ACCOUNT_KEYS });
}

function taskSummary(task: UnknownRecord | undefined): UnknownRecord {
	return idText({ record: task, keys: TASK_KEYS });
}

function dealSummary(deal: UnknownRecord | undefined): UnknownRecord {
	const value = acData.textAt({ value: deal, key: 'value' });
	const status = acData.textAt({ value: deal, key: 'status' });
	return {
		...idText({ record: deal, keys: ['id', 'title', 'description', 'currency', 'group', 'stage', 'owner', 'contact', 'account', 'cdate', 'mdate', 'isDisabled'] }),
		...(value !== undefined ? { value, valueFormatted: centsToDecimal(value) } : {}),
		...(status !== undefined ? { status: DEAL_STATUS_LABELS[status] ?? status } : {}),
	};
}

export const aiInput = {
	optionalText,
	requireText,
	numericId,
	optionalNumericId,
	pageParams,
	isoDateTime,
	dollarsToCents,
	centsToDecimal,
	currencyCode,
	customFieldEntries,
	contactFieldValues,
	accountFields,
	resolveContactId,
	dealStatusCode,
};

export const aiOutput = { contactSummary, accountSummary, accountCustomFieldValues, taskSummary, dealSummary, idText };

export const aiProps = {
	contactIdOrEmail: ({ displayName = 'Contact ID or Email', required = true }: { displayName?: string; required?: boolean } = {}) =>
		Property.ShortText({
			displayName,
			description: 'The numeric contact ID, or the contact\'s email address. Use List Contacts to find an ID.',
			required,
		}),
	limit: Property.Number({
		displayName: 'Limit',
		description: 'How many records to return, 1 to 100. Defaults to 20.',
		required: false,
	}),
	offset: Property.Number({
		displayName: 'Offset',
		description: 'How many records to skip, for the next page. Use the previous offset plus limit while hasMore is true.',
		required: false,
	}),
	dealStatus: Property.StaticDropdown<string>({
		displayName: 'Status',
		description: 'open, won or lost (the codes 0, 1 and 2 are also accepted). Leave empty to keep the current status (new deals start open).',
		required: false,
		options: {
			disabled: false,
			options: [
				{ label: 'Open', value: 'open' },
				{ label: 'Won', value: 'won' },
				{ label: 'Lost', value: 'lost' },
			],
		},
	}),
	contactCustomFields: Property.Json({
		displayName: 'Custom Fields',
		description:
			'Optional JSON object keyed by contact custom field ID, such as {"3": "Gold", "7": ["Option A", "Option B"]}. Get the IDs and option values from List Contact Custom Fields. Dates use YYYY-MM-DD.',
		required: false,
	}),
	accountCustomFields: Property.Json({
		displayName: 'Custom Fields',
		description:
			'Optional JSON object keyed by account custom field ID, such as {"2": "Enterprise"}. Get the IDs and option values from List Account Custom Fields.',
		required: false,
	}),
};

export type CustomFieldEntry = {
	fieldId: string;
	value: string | string[];
};
