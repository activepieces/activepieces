import { Property } from '@activepieces/pieces-framework';
import { manychatAuth } from '../auth';
import { manychatClient, manychatUtils } from './client';

async function tagOptions({ auth }: { auth: unknown }) {
	const apiKey = manychatUtils.apiKeyOf(auth);
	if (apiKey === '') {
		return disconnected();
	}
	try {
		const tags = manychatUtils.recordsOf(manychatUtils.dataOf(await manychatClient.request({ apiKey, method: 'GET', path: '/page/getTags', operation: 'list tags' })));
		return {
			disabled: false,
			options: tags.flatMap((tag) => (typeof tag['id'] === 'number' ? [{ label: String(tag['name'] ?? tag['id']), value: tag['id'] }] : [])),
		};
	} catch (error) {
		return failed({ error });
	}
}

async function customFieldOptions({ auth, allowedTypes }: { auth: unknown; allowedTypes: readonly string[] }) {
	const apiKey = manychatUtils.apiKeyOf(auth);
	if (apiKey === '') {
		return disconnected();
	}
	try {
		const fields = await listCustomFields({ apiKey });
		return {
			disabled: false,
			options: fields
				.filter((field) => allowedTypes.includes(String(field['type'])))
				.flatMap((field) => (typeof field['id'] === 'number' ? [{ label: String(field['name'] ?? field['id']), value: field['id'] }] : [])),
		};
	} catch (error) {
		return failed({ error });
	}
}

async function flowOptions({ auth }: { auth: unknown }) {
	const apiKey = manychatUtils.apiKeyOf(auth);
	if (apiKey === '') {
		return disconnected();
	}
	try {
		const { flows, folders } = await listFlows({ apiKey });
		return {
			disabled: false,
			options: flows.flatMap((flow) => {
				const ns = flow['ns'];
				if (typeof ns !== 'string' || ns === '') {
					return [];
				}
				const name = String(flow['name'] ?? ns);
				const folder = folderPath({ folderId: flow['folder_id'], folders });
				return [{ label: folder === '' ? name : `${folder} / ${name}`, value: ns }];
			}),
		};
	} catch (error) {
		return failed({ error });
	}
}

async function listCustomFields({ apiKey }: { apiKey: string }): Promise<Record<string, unknown>[]> {
	return manychatUtils.recordsOf(manychatUtils.dataOf(await manychatClient.request({ apiKey, method: 'GET', path: '/page/getCustomFields', operation: 'list custom fields' })));
}

async function listFlows({ apiKey }: { apiKey: string }): Promise<{ flows: Record<string, unknown>[]; folders: Record<string, unknown>[] }> {
	const data = manychatUtils.recordOf(manychatUtils.dataOf(await manychatClient.request({ apiKey, method: 'GET', path: '/page/getFlows', operation: 'list flows' })));
	return { flows: manychatUtils.recordsOf(data['flows']), folders: manychatUtils.recordsOf(data['folders']) };
}

async function getSubscriber({ apiKey, subscriberId }: { apiKey: string; subscriberId: string }): Promise<Record<string, unknown>> {
	const body = await manychatClient.request({
		apiKey,
		method: 'GET',
		path: '/subscriber/getInfo',
		operation: 'get subscriber',
		query: { subscriber_id: subscriberId },
	});
	const data = manychatUtils.dataOf(body);
	if (!manychatUtils.isRecord(data)) {
		throw new Error(`ManyChat returned no subscriber for ID ${subscriberId}.`);
	}
	return data;
}

function folderPath({ folderId, folders }: { folderId: unknown; folders: Record<string, unknown>[] }): string {
	const names: string[] = [];
	const visited = new Set<unknown>();
	let current = folderId;
	while (current !== undefined && current !== null && current !== 0 && !visited.has(current)) {
		visited.add(current);
		const folder = folders.find((item) => item['id'] === current);
		if (folder === undefined) {
			break;
		}
		names.unshift(String(folder['name'] ?? folder['id']));
		current = folder['parent_id'];
	}
	return names.join(' / ');
}

function subscriberIdText({ value, label = 'Subscriber ID' }: { value: unknown; label?: string }): string {
	const text = typeof value === 'number' ? (Number.isSafeInteger(value) ? String(value) : '') : typeof value === 'string' ? value.trim() : '';
	if (!/^[1-9][0-9]{0,19}$/.test(text)) {
		throw new Error(`${label} must be the numeric ManyChat subscriber ID (digits only).`);
	}
	return text;
}

function apiId(digits: string): number | string {
	const number = Number(digits);
	return Number.isSafeInteger(number) ? number : digits;
}

function coerceFieldValue({ type, value, label }: { type: string; value: unknown; label: string }): string | number | boolean {
	switch (type) {
		case 'text':
			return textValue({ value, label });
		case 'number':
			return numberValue({ value, label });
		case 'boolean':
			return booleanValue({ value, label });
		case 'date':
			return dateValue({ value, label });
		case 'datetime':
			return dateTimeValue({ value, label });
		default:
			throw new Error(`${label} has type "${type}", which ManyChat does not let the API set.`);
	}
}

function textValue({ value, label }: { value: unknown; label: string }): string {
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		const text = String(value);
		if (text.trim() === '') {
			throw new Error(`${label} is empty. ManyChat can't clear a custom field through the API, so give a non-empty value.`);
		}
		return text;
	}
	throw new Error(`${label} must be text.`);
}

function numberValue({ value, label }: { value: unknown; label: string }): number {
	const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value.trim()) : Number.NaN;
	if (!Number.isFinite(number)) {
		throw new Error(`${label} must be a number.`);
	}
	return number;
}

function booleanValue({ value, label }: { value: unknown; label: string }): boolean {
	if (value === true || value === false) {
		return value;
	}
	const text = typeof value === 'string' ? value.trim().toLowerCase() : '';
	if (text === 'true' || text === 'yes') {
		return true;
	}
	if (text === 'false' || text === 'no') {
		return false;
	}
	throw new Error(`${label} must be true or false.`);
}

function dateValue({ value, label }: { value: unknown; label: string }): string {
	const text = typeof value === 'string' ? value.trim() : '';
	const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(text);
	if (match === null || !isCalendarDate({ year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) })) {
		throw new Error(`${label} must be a real date in YYYY-MM-DD format.`);
	}
	return `${match[1]}-${match[2]}-${match[3]}`;
}

function dateTimeValue({ value, label }: { value: unknown; label: string }): string {
	const text = typeof value === 'string' ? value.trim() : '';
	const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/i.exec(text);
	if (
		match === null ||
		!isCalendarDate({ year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }) ||
		Number(match[4]) > 23 ||
		Number(match[5]) > 59 ||
		Number(match[6] ?? '0') > 59
	) {
		throw new Error(`${label} must be a real date and time, for example 2026-11-11T14:30:00+02:00 (no offset means UTC).`);
	}
	const offset = normalizeOffset({ raw: match[7], label });
	return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6] ?? '00'}${offset}`;
}

function normalizeOffset({ raw, label }: { raw: string | undefined; label: string }): string {
	if (raw === undefined || raw.toUpperCase() === 'Z') {
		return '+00:00';
	}
	const digits = raw.replace(':', '');
	const hours = Number(digits.slice(1, 3));
	const minutes = Number(digits.slice(3, 5));
	if (hours > 14 || minutes > 59) {
		throw new Error(`${label} has an invalid UTC offset "${raw}".`);
	}
	return `${digits.slice(0, 1)}${digits.slice(1, 3)}:${digits.slice(3, 5)}`;
}

function isCalendarDate({ year, month, day }: { year: number; month: number; day: number }): boolean {
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function optionalText(value: unknown): string | undefined {
	if (typeof value !== 'string' && typeof value !== 'number') {
		return undefined;
	}
	const text = String(value).trim();
	return text === '' ? undefined : text;
}

function checkContactRules({
	phone,
	email,
	smsOptIn,
	emailOptIn,
	consentPhrase,
}: {
	phone: string | undefined;
	email: string | undefined;
	smsOptIn: boolean | undefined;
	emailOptIn: boolean | undefined;
	consentPhrase: string | undefined;
}): void {
	if (phone !== undefined && smsOptIn === undefined) {
		throw new Error('SMS Opt-in is required when Phone is set (ManyChat rule).');
	}
	if (email !== undefined && emailOptIn === undefined) {
		throw new Error('Email Opt-in is required when Email is set (ManyChat rule).');
	}
	if (smsOptIn === true && consentPhrase === undefined) {
		throw new Error('Consent Phrase is required when SMS Opt-in is on (ManyChat rule).');
	}
}

function disconnected() {
	return { disabled: true, placeholder: 'Please connect your account.', options: [] };
}

function failed({ error }: { error: unknown }) {
	return {
		disabled: true,
		placeholder: `Could not load options: ${error instanceof Error ? error.message : String(error)}`.slice(0, 300),
		options: [],
	};
}

export const subscriberId = Property.Number({
	displayName: 'User ID',
	description: `The ManyChat subscriber (contact) ID. Please refer [Manychat Guide](https://help.manychat.com/hc/en-us/articles/14959510331420-How-to-generate-a-token-for-the-Manychat-API-and-where-to-get-parameters#h_01JCR55RJ0B0PQW6HDW6RW0A42) to obtain user/contact ID.`,
	required: true,
});

export const tagIdDropdown = Property.Dropdown({
	auth: manychatAuth,
	displayName: 'Tag',
	refreshers: [],
	required: true,
	options: async ({ auth }) => tagOptions({ auth }),
});

export const manychatProps = {
	subscriberIdText: ({ displayName = 'Subscriber ID' }: { displayName?: string } = {}) =>
		Property.ShortText({
			displayName,
			description: 'The numeric ManyChat subscriber (contact) ID, for example from "Find Subscriber by Email or Phone" or a contact profile.',
			required: true,
		}),
	customFieldDropdown: ({ allowedTypes }: { allowedTypes: readonly string[] }) =>
		Property.Dropdown({
			auth: manychatAuth,
			displayName: 'Custom Field',
			refreshers: [],
			required: true,
			options: async ({ auth }) => customFieldOptions({ auth, allowedTypes }),
		}),
	flowDropdown: () =>
		Property.Dropdown({
			auth: manychatAuth,
			displayName: 'Flow',
			description: 'The flow to start. Its namespace (ns) is sent to ManyChat. The flow must be published in ManyChat; drafts appear in the list but can\'t be sent.',
			refreshers: [],
			required: true,
			options: async ({ auth }) => flowOptions({ auth }),
		}),
};

export const manychatData = {
	listCustomFields,
	listFlows,
	getSubscriber,
	folderPath,
};

export const manychatInput = {
	optionalText,
	checkContactRules,
	subscriberIdText,
	apiId,
	coerceFieldValue,
};

export const SETTABLE_FIELD_TYPES = ['text', 'number', 'date', 'datetime', 'boolean'] as const;
