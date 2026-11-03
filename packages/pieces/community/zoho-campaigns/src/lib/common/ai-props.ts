import { Property } from '@activepieces/pieces-framework';

import type { PropParams } from './props';
import type { ZohoCampaignsSignupForm, ZohoCampaignsSort } from './types';

function campaignKey<R extends boolean>({
	required,
	displayName = 'Campaign Key',
	description = 'The campaign key, e.g. "f70c4878c4a47169407e63917ad24497". Use List Campaigns or Create Campaign to get it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function listKey<R extends boolean>({
	required,
	displayName = 'Mailing List Key',
	description = 'The mailing list key, e.g. "3c20ad524dfa4af86216a5be13e238ed". Use List Mailing Lists or Create Mailing List to get it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function contactEmail<R extends boolean>({
	required,
	displayName = 'Contact Email',
	description = 'Email address of the contact.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function topicId<R extends boolean>({
	required,
	displayName = 'Topic ID',
	description = 'Topic ID from List Topics. Required on accounts that use topic management.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function signupForm<R extends boolean>({
	required,
	displayName = 'Signup Form',
	description = 'public lets people join the list through a signup form; private does not.',
}: PropParams<R>) {
	return Property.StaticDropdown<ZohoCampaignsSignupForm, R>({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: [
				{ label: 'Public', value: 'public' },
				{ label: 'Private', value: 'private' },
			],
		},
	});
}

function fromIndex<R extends boolean>({
	required,
	displayName = 'From Index',
	description = 'The 1-based position of the first record to return. Defaults to 1.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function range<R extends boolean>({
	required,
	displayName = 'Range',
	description = 'How many records to return from From Index. Zoho Campaigns applies its own default when unset.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function sort<R extends boolean>({
	required,
	displayName = 'Sort Order',
	description = 'Sort order of the results: asc or desc.',
}: PropParams<R>) {
	return Property.StaticDropdown<ZohoCampaignsSort, R>({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: [
				{ label: 'Ascending', value: 'asc' },
				{ label: 'Descending', value: 'desc' },
			],
		},
	});
}

export const zohoCampaignsAiProps = {
	campaignKey,
	listKey,
	contactEmail,
	topicId,
	signupForm,
	fromIndex,
	range,
	sort,
};
