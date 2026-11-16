import { Property } from '@activepieces/pieces-framework';
import { beehiivClient, isRecord, pathFor } from './client';

function publicationIdProp() {
	return Property.ShortText({
		displayName: 'Publication ID',
		description: 'The publication ID (starts with "pub_"). Get it from "List Publications".',
		required: true,
	});
}

function subscriptionIdProp({ required = false }: { required?: boolean } = {}) {
	return Property.ShortText({
		displayName: 'Subscription ID',
		description: required
			? 'The subscription ID (starts with "sub_"). Get it from "List Subscriptions (AI)" or "Get Subscription".'
			: 'The subscription ID (starts with "sub_"). Provide this OR Email, not both.',
		required,
	});
}

function subscriberEmailProp() {
	return Property.ShortText({
		displayName: 'Email',
		description: 'The subscriber email address (exact match, case-insensitive). Provide this OR Subscription ID, not both.',
		required: false,
	});
}

function yesNoProp({ displayName, description }: { displayName: string; description: string }) {
	return Property.StaticDropdown<string>({
		displayName,
		description: `${description} Leave empty to use the beehiiv default.`,
		required: false,
		options: {
			options: [
				{ label: 'Yes', value: 'yes' },
				{ label: 'No', value: 'no' },
			],
		},
	});
}

function limitProp({ max = 100 }: { max?: number } = {}) {
	return Property.Number({
		displayName: 'Limit',
		description: `How many items to return (1-${max}, default 25).`,
		required: false,
		defaultValue: 25,
	});
}

function pageProp() {
	return Property.Number({
		displayName: 'Page',
		description: 'Page number, starting at 1 (default 1). beehiiv stops at page 100.',
		required: false,
		defaultValue: 1,
	});
}

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

function yesNo({ value, label }: { value: unknown; label: string }): boolean | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	if (value === 'yes' || value === true) {
		return true;
	}
	if (value === 'no' || value === false) {
		return false;
	}
	throw new Error(`${label} must be "yes" or "no".`);
}

function oneOf<T extends string>({ value, label, allowed }: { value: unknown; label: string; allowed: readonly T[] }): T | undefined {
	const text = optionalText(value);
	if (text === undefined) {
		return undefined;
	}
	const match = allowed.find((option) => option === text);
	if (match === undefined) {
		throw new Error(`${label} must be one of: ${allowed.join(', ')} (got "${text.slice(0, 50)}").`);
	}
	return match;
}

function integerInRange({
	value,
	label,
	min,
	max,
	fallback,
}: {
	value: unknown;
	label: string;
	min: number;
	max: number;
	fallback: number;
}): number {
	if (value === undefined || value === null || value === '') {
		return fallback;
	}
	const number = Number(value);
	if (!Number.isInteger(number) || number < min || number > max) {
		throw new Error(`${label} must be a whole number between ${min} and ${max}.`);
	}
	return number;
}

function textList({ value, label }: { value: unknown; label: string }): string[] | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	const raw = Array.isArray(value) ? value : String(value).split(',');
	const items = raw.map((item) => {
		if (typeof item !== 'string' && typeof item !== 'number') {
			throw new Error(`${label} must be a list of text values.`);
		}
		return String(item).trim();
	});
	const unique = Array.from(new Set(items.filter((item) => item !== '')));
	return unique.length === 0 ? undefined : unique;
}

function customFieldEntries({ value, label }: { value: unknown; label: string }): CustomFieldInput[] | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	const parsed: unknown = typeof value === 'string' ? parseJson({ text: value, label }) : value;
	if (!isRecord(parsed)) {
		throw new Error(`${label} must be an object of field name to value, for example {"First Name": "Ada"}.`);
	}
	const entries = Object.entries(parsed).map(([name, fieldValue]) => {
		const trimmed = name.trim();
		if (trimmed === '') {
			throw new Error(`${label} contains an empty field name.`);
		}
		if (!isCustomFieldValue(fieldValue)) {
			throw new Error(`${label} "${trimmed}" must be text, a number, true/false, or a list of text.`);
		}
		return { name: trimmed, value: fieldValue };
	});
	return entries.length === 0 ? undefined : entries;
}

async function resolveSubscriptionId({
	apiKey,
	publicationId,
	subscriptionId,
	email,
}: {
	apiKey: string;
	publicationId: string;
	subscriptionId: unknown;
	email: unknown;
}): Promise<string> {
	const identity = subscriberIdentity({ subscriptionId, email });
	if (identity.kind === 'id') {
		return identity.value;
	}
	const response = await beehiivClient.request({
		apiKey,
		method: 'GET',
		path: `${pathFor(['publications', publicationId, 'subscriptions', 'by_email', identity.value])}`,
		operation: 'find subscription by email',
	});
	const data = isRecord(response.body) && isRecord(response.body['data']) ? response.body['data'] : undefined;
	const id = data !== undefined && typeof data['id'] === 'string' ? data['id'] : undefined;
	if (id === undefined) {
		throw new Error('beehiiv did not return a subscription ID for this email.');
	}
	return id;
}

function subscriberIdentity({ subscriptionId, email }: { subscriptionId: unknown; email: unknown }): SubscriberIdentity {
	const id = optionalText(subscriptionId);
	const address = optionalText(email);
	if (id !== undefined && address !== undefined) {
		throw new Error('Provide either Subscription ID or Email, not both.');
	}
	if (id !== undefined) {
		return { kind: 'id', value: id };
	}
	if (address !== undefined) {
		if (!address.includes('@')) {
			throw new Error('Email must be a full email address.');
		}
		return { kind: 'email', value: address };
	}
	throw new Error('Provide either Subscription ID or Email.');
}

function subscriptionPath({ publicationId, identity }: { publicationId: string; identity: SubscriberIdentity }): string {
	return identity.kind === 'id'
		? pathFor(['publications', publicationId, 'subscriptions', identity.value])
		: pathFor(['publications', publicationId, 'subscriptions', 'by_email', identity.value]);
}

function dataOf(body: unknown): Record<string, unknown> {
	if (!isRecord(body)) {
		return {};
	}
	if (!('data' in body)) {
		return body;
	}
	return isRecord(body['data']) ? body['data'] : {};
}

function warningsOf(body: unknown): unknown[] {
	return isRecord(body) && Array.isArray(body['warnings']) ? body['warnings'] : [];
}

function parseJson({ text, label }: { text: string; label: string }): unknown {
	try {
		return JSON.parse(text);
	} catch {
		throw new Error(`${label} must be valid JSON.`);
	}
}

function isCustomFieldValue(value: unknown): value is CustomFieldValue {
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		return true;
	}
	return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function postFilterProps() {
	return {
		status: Property.StaticDropdown<string>({
			displayName: 'Status',
			description: 'draft, confirmed (published or scheduled) or archived. Leave empty for all.',
			required: false,
			options: { options: ['draft', 'confirmed', 'archived'].map((value) => ({ label: value, value })) },
		}),
		audience: Property.StaticDropdown<string>({
			displayName: 'Audience',
			description: 'free or premium posts. Leave empty for all.',
			required: false,
			options: { options: ['free', 'premium'].map((value) => ({ label: value, value })) },
		}),
		platform: Property.StaticDropdown<string>({
			displayName: 'Platform',
			description: 'web, email or both. Leave empty for all.',
			required: false,
			options: { options: ['web', 'email', 'both'].map((value) => ({ label: value, value })) },
		}),
		content_tags: Property.Array({ displayName: 'Content Tags', description: 'Only posts with any of these content tags.', required: false }),
	};
}

function postFilterQuery({ propsValue }: { propsValue: Record<string, unknown> }) {
	return {
		status: oneOf({ value: propsValue['status'], label: 'Status', allowed: ['draft', 'confirmed', 'archived'] }) ?? 'all',
		audience: oneOf({ value: propsValue['audience'], label: 'Audience', allowed: ['free', 'premium'] }) ?? 'all',
		platform: oneOf({ value: propsValue['platform'], label: 'Platform', allowed: ['web', 'email', 'both'] }) ?? 'all',
		'content_tags[]': textList({ value: propsValue['content_tags'], label: 'Content Tags' }),
	};
}

export const aiProps = {
	publicationId: publicationIdProp,
	subscriptionId: subscriptionIdProp,
	subscriberEmail: subscriberEmailProp,
	yesNo: yesNoProp,
	limit: limitProp,
	page: pageProp,
};

export const aiInput = {
	optionalText,
	requireText,
	yesNo,
	oneOf,
	integerInRange,
	textList,
	customFieldEntries,
	subscriberIdentity,
	subscriptionPath,
	resolveSubscriptionId,
	dataOf,
	warningsOf,
};

export const aiPostFilters = {
	props: postFilterProps,
	query: postFilterQuery,
};

export const SUBSCRIPTION_EXPAND_VALUES = ['custom_fields', 'tags', 'stats', 'referrals', 'newsletter_lists'] as const;

export const CUSTOM_FIELD_KINDS = ['string', 'integer', 'double', 'boolean', 'date', 'datetime', 'list'] as const;

export const POST_EXPAND_VALUES = ['stats', 'free_web_content', 'free_email_content', 'free_rss_content', 'premium_web_content', 'premium_email_content'] as const;

export const DOUBLE_OPT_VALUES = ['on', 'off', 'not_set'] as const;

export type CustomFieldValue = string | number | boolean | string[];

export type CustomFieldInput = { name: string; value: CustomFieldValue };

export type SubscriberIdentity = { kind: 'id' | 'email'; value: string };
