import { Property } from '@activepieces/pieces-framework';

import type { PropParams } from './props';

function listId<R extends boolean>({
	required,
	displayName = 'List ID',
	description = 'The list ID (UUID). Use List Lists to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function contact<R extends boolean>({
	required,
	displayName = 'Contact',
	description = "The contact's ID (UUID) or its email address. Both work; an email address is matched case-insensitively.",
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function campaignId<R extends boolean>({
	required,
	displayName = 'Campaign ID',
	description = 'The campaign ID (UUID). Use List Campaigns to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function tag<R extends boolean>({
	required,
	displayName = 'Tag',
	description = 'The tag name, exactly as it appears on the list. Use List Tags to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function fields<R extends boolean>({
	required,
	displayName = 'Fields',
	description = 'Custom field values keyed by field tag, e.g. {"FirstName": "Ada", "Age": 36}. Use Get List to see the list\'s field tags and types.',
}: PropParams<R>) {
	return Property.Json({ displayName, description, required });
}

function fieldsToClear<R extends boolean>({
	required,
	displayName = 'Fields to Clear',
	description = 'Field tags whose value to remove from the contact, e.g. ["FirstName"]. A tag listed here must not also be in Fields.',
}: PropParams<R>) {
	return Property.Array({ displayName, description, required });
}

function status<R extends boolean>({
	required,
	displayName = 'Status',
	description = 'The contact status.',
}: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: [
				{ label: 'Subscribed', value: 'subscribed' },
				{ label: 'Unsubscribed', value: 'unsubscribed' },
				{ label: 'Pending', value: 'pending' },
			],
		},
	});
}

function tagsToAdd<R extends boolean>({
	required,
	displayName = 'Tags to Add',
	description = 'Tag names to add to the contact. Tags not listed are left as they are.',
}: PropParams<R>) {
	return Property.Array({ displayName, description, required });
}

function tagsToRemove<R extends boolean>({
	required,
	displayName = 'Tags to Remove',
	description = 'Tag names to remove from the contact. Tags not listed are left as they are.',
}: PropParams<R>) {
	return Property.Array({ displayName, description, required });
}

function limit<R extends boolean>({
	required,
	displayName = 'Limit',
	description = 'Max items to return (1-100). Defaults to 100.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function startingAfter<R extends boolean>({
	required,
	displayName = 'Starting After',
	description = 'Cursor for the next page: `paging.next.starting_after` from the previous call with the same filters. Leave empty for the first page.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

export const emailOctopusAiProps = {
	listId,
	contact,
	campaignId,
	tag,
	fields,
	fieldsToClear,
	status,
	tagsToAdd,
	tagsToRemove,
	limit,
	startingAfter,
};
