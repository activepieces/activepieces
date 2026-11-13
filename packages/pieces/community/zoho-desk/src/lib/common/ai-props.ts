import { Property } from '@activepieces/pieces-framework';

import type { PropParams } from './props';

function ticketId<R extends boolean>({
	required,
	displayName = 'Ticket ID',
	description = 'Ticket ID (the `id` from List Tickets or Search Tickets, not the ticket number).',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function contactId<R extends boolean>({
	required,
	displayName = 'Contact ID',
	description = 'Contact ID (the `id` from List Contacts or Search Contacts).',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function accountId<R extends boolean>({
	required,
	displayName = 'Account ID',
	description = 'Account ID (the `id` from List Accounts or Search Accounts).',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function taskId<R extends boolean>({
	required,
	displayName = 'Task ID',
	description = 'Task ID (the `id` from List Tasks or Search Tasks).',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function productId<R extends boolean>({
	required,
	displayName = 'Product ID',
	description = 'Product ID (the `id` from List Products or Search Products).',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function departmentId<R extends boolean>({
	required,
	displayName = 'Department ID',
	description = 'Department ID (the `id` from List Departments).',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function agentId<R extends boolean>({
	required,
	displayName = 'Agent ID',
	description = 'Agent ID (the `id` from List Agents).',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function from<R extends boolean>({
	required,
	displayName = 'From',
	description = 'Index of the first record to return, starting at 1. Use with Limit to page through results.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function limit<R extends boolean>({
	required,
	displayName = 'Limit',
	description = 'Maximum number of records to return, from 1 to 100.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function yesNo<R extends boolean>({
	required,
	displayName = 'Enabled',
	description,
}: PropParams<R>) {
	return Property.StaticDropdown<boolean, R>({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: [
				{ label: 'Yes', value: true },
				{ label: 'No', value: false },
			],
		},
	});
}

export const zohoDeskAiProps = {
	ticketId,
	contactId,
	accountId,
	taskId,
	productId,
	departmentId,
	agentId,
	from,
	limit,
	yesNo,
};
