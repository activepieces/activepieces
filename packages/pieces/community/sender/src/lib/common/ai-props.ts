import { Property } from '@activepieces/pieces-framework';

import type { PropParams } from './props';

function page<R extends boolean>({
	required,
	displayName = 'Page',
	description = 'Page number to return, starting at 1. Defaults to 1. Use the returned `meta.last_page` or `links.next` to know if more pages exist.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function limit<R extends boolean>({
	required,
	displayName = 'Limit',
	description = 'How many records to return per page. Sender applies its own default when empty.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function subscriberId<R extends boolean>({
	required,
	displayName = 'Subscriber',
	description = "The subscriber's email address, phone number (with country code) or Sender subscriber ID. Use List Subscribers to find it.",
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function subscribers<R extends boolean>({
	required,
	displayName = 'Subscriber Emails',
	description = 'List of subscriber email addresses, e.g. ["jane@example.com"].',
}: PropParams<R>) {
	return Property.Array({ displayName, description, required });
}

function groupId<R extends boolean>({
	required,
	displayName = 'Group ID',
	description = 'Sender group ID, e.g. "eZVD4w". Use List Groups to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function groups<R extends boolean>({
	required,
	displayName = 'Group IDs',
	description = 'List of Sender group IDs, e.g. ["eZVD4w"]. Use List Groups to find them.',
}: PropParams<R>) {
	return Property.Array({ displayName, description, required });
}

function campaignId<R extends boolean>({
	required,
	displayName = 'Campaign ID',
	description = 'Sender campaign ID, e.g. "eE0x14". Use List Campaigns to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function transactionalCampaignId<R extends boolean>({
	required,
	displayName = 'Transactional Campaign ID',
	description = 'Sender transactional campaign ID. Use List Transactional Campaigns to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function workflowId<R extends boolean>({
	required,
	displayName = 'Workflow ID',
	description = 'Sender workflow ID. Use List Workflows to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function fieldId<R extends boolean>({
	required,
	displayName = 'Field ID',
	description = 'Sender custom field ID. Use List Fields to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function segmentId<R extends boolean>({
	required,
	displayName = 'Segment ID',
	description = 'Sender segment ID. Use List Segments to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function yesNo<R extends boolean>({
	required,
	displayName,
	description,
}: PropParams<R> & { displayName: string }) {
	return Property.StaticDropdown<string, R>({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: [
				{ label: 'Yes', value: 'yes' },
				{ label: 'No', value: 'no' },
			],
		},
	});
}

function triggerAutomation<R extends boolean>({
	required,
	displayName = 'Trigger Automation',
	description = 'Whether this change starts matching automation workflows. Sender defaults to Yes when empty.',
}: PropParams<R>) {
	return yesNo({ required, displayName, description });
}

function direction<R extends boolean>({
	required,
	displayName = 'Sort Direction',
	description = 'Sort by date, newest first (desc) or oldest first (asc).',
}: PropParams<R>) {
	return Property.StaticDropdown<string, R>({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: [
				{ label: 'Newest first', value: 'desc' },
				{ label: 'Oldest first', value: 'asc' },
			],
		},
	});
}

export const senderAiProps = {
	page,
	limit,
	subscriberId,
	subscribers,
	groupId,
	groups,
	campaignId,
	transactionalCampaignId,
	workflowId,
	fieldId,
	segmentId,
	yesNo,
	triggerAutomation,
	direction,
};
