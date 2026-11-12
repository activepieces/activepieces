import { Property } from '@activepieces/pieces-framework';
import { ccClient, ccContacts } from './client';
import { ccInput } from './props';

function limit({ value, max, fallback }: { value: unknown; max: number; fallback: number }): number {
	return ccInput.wholeNumber({ value, label: 'Limit', min: 1, max }) ?? fallback;
}

function cursor(value: unknown): string | undefined {
	const text = ccInput.optionalText(value);
	if (text === undefined) {
		return undefined;
	}
	if (!CURSOR.test(text)) {
		throw new Error('Cursor must be the next_cursor value returned by the previous call.');
	}
	return text;
}

function isoDateTime({ value, label }: { value: unknown; label: string }): string | undefined {
	const text = ccInput.optionalText(value);
	if (text === undefined) {
		return undefined;
	}
	const candidate = ISO_DATE.test(text) ? `${text}T00:00:00Z` : text;
	if (!ISO_DATE_TIME.test(candidate) || Number.isNaN(Date.parse(candidate))) {
		throw new Error(`${label} must be an ISO 8601 date or date-time such as 2026-03-01 or 2026-03-01T09:00:00Z (got "${text.slice(0, 40)}").`);
	}
	return new Date(candidate).toISOString();
}

function yesNo({ value, label }: { value: unknown; label: string }): boolean | undefined {
	const text = ccInput.optionalText(value)?.toLowerCase();
	if (text === undefined) {
		return undefined;
	}
	if (text === 'yes' || text === 'true') {
		return true;
	}
	if (text === 'no' || text === 'false') {
		return false;
	}
	throw new Error(`${label} must be yes or no.`);
}

function emailList({ value, label, max }: { value: unknown; label: string; max: number }): string[] {
	const emails = [...new Set(ccInput.textList(value))];
	const invalid = emails.find((email) => !EMAIL.test(email));
	if (invalid !== undefined) {
		throw new Error(`${label}: "${invalid.slice(0, 80)}" is not an email address.`);
	}
	if (emails.length === 0 || emails.length > max) {
		throw new Error(`${label} needs between 1 and ${max} email addresses (got ${emails.length}).`);
	}
	return emails;
}

async function resolveContactIds({ accessToken, value, label }: { accessToken: string; value: unknown; label: string }): Promise<string[]> {
	const refs = [...new Set(ccInput.textList(value))];
	if (refs.length === 0) {
		throw new Error(`${label} is required.`);
	}
	if (refs.length > MAX_CONTACT_REFS) {
		throw new Error(`${label} accepts at most ${MAX_CONTACT_REFS} contacts per call (got ${refs.length}).`);
	}
	const emails = refs.filter((ref) => !ccClient.isUuid(ref));
	if (emails.length > MAX_EMAIL_LOOKUPS) {
		throw new Error(`${label}: at most ${MAX_EMAIL_LOOKUPS} entries may be email addresses (each costs one lookup); pass contact IDs for the rest.`);
	}
	const ids: string[] = [];
	for (const ref of refs) {
		ids.push(await ccContacts.resolveContactId({ accessToken, value: ref, label }));
	}
	return [...new Set(ids)];
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:?\d{2})$/;
const CURSOR = /^[A-Za-z0-9+/=_.%-]{1,2000}$/;
const EMAIL = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;
const MAX_CONTACT_REFS = 500;
const MAX_EMAIL_LOOKUPS = 20;

export const aiInput = { limit, cursor, isoDateTime, yesNo, emailList, resolveContactIds };

export const aiProps = {
	contactIdOrEmail: () =>
		Property.ShortText({
			displayName: 'Contact ID or Email',
			description: 'The contact_id (UUID) or the contact\'s email address. Deleted contacts are not matched by email.',
			required: true,
		}),
	contactRefs: () =>
		Property.ShortText({
			displayName: 'Contacts',
			description: 'Comma-separated contact IDs (UUIDs), up to 500. Up to 20 of them may be email addresses instead, each resolved with one extra lookup.',
			required: true,
		}),
	listIds: ({ description }: { description: string }) => Property.ShortText({ displayName: 'List IDs', description, required: true }),
	tagIds: ({ description }: { description: string }) => Property.ShortText({ displayName: 'Tag IDs', description, required: true }),
	limit: ({ max, fallback }: { max: number; fallback: number }) =>
		Property.Number({ displayName: 'Limit', description: `How many records to return, 1 to ${max}. Defaults to ${fallback}.`, required: false }),
	cursor: () =>
		Property.ShortText({
			displayName: 'Cursor',
			description: 'Leave empty for the first page. To get the next page, pass the next_cursor from the previous call with the same filters.',
			required: false,
		}),
	yesNo: ({ displayName, description }: { displayName: string; description: string }) =>
		Property.StaticDropdown<string>({
			displayName,
			description,
			required: false,
			options: { disabled: false, options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
		}),
	text: ({ displayName, description, required = false }: { displayName: string; description: string; required?: boolean }) =>
		Property.ShortText({ displayName, description, required }),
	customFieldsJson: () =>
		Property.Json({
			displayName: 'Custom Fields',
			description: 'Optional JSON object keyed by custom_field_id (UUID from List Custom Fields), such as {"<custom_field_id>": "Gold"}. Values are text, at most 255 characters.',
			required: false,
		}),
};
