import { Property } from '@activepieces/pieces-framework';

import type { PropParams } from './props';

const CHANGE_FEED_TYPES = [
	'TIME_ENTRY',
	'PROJECTS',
	'TASKS',
	'CLIENTS',
	'TAGS',
	'USER',
	'USER_GROUPS',
	'CUSTOM_FIELDS',
	'TIME_ENTRY_CUSTOM_FIELD_VALUE',
	'TIME_ENTRY_RATE',
	'HOLIDAYS',
	'INVOICES',
	'APPROVAL_REQUESTS',
	'SCHEDULED_ASSIGNMENT',
	'TIME_OFF_REQUEST',
	'PTO_POLICY',
	'BALANCE',
];

function idProp<R extends boolean>({
	required,
	displayName,
	description,
}: PropParams<R> & { displayName: string }) {
	return Property.ShortText({ displayName, description, required });
}

function workspaceId<R extends boolean>({
	required,
	displayName = 'Workspace ID',
	description = 'Workspace ID. Use List Workspaces to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function userId<R extends boolean>({
	required,
	displayName = 'User ID',
	description = 'User ID. Use List Users, or Get Current User for yourself.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function projectId<R extends boolean>({
	required,
	displayName = 'Project ID',
	description = 'Project ID. Use List Projects to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function taskId<R extends boolean>({
	required,
	displayName = 'Task ID',
	description = 'Task ID. Use List Tasks to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function clientId<R extends boolean>({
	required,
	displayName = 'Client ID',
	description = 'Client ID. Use List Clients to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function tagId<R extends boolean>({
	required,
	displayName = 'Tag ID',
	description = 'Tag ID. Use List Tags to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function userGroupId<R extends boolean>({
	required,
	displayName = 'User Group ID',
	description = 'User group ID. Use List User Groups to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function timeEntryId<R extends boolean>({
	required,
	displayName = 'Time Entry ID',
	description = 'Time entry ID. Use List Time Entries to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function templateId<R extends boolean>({
	required,
	displayName = 'Template ID',
	description = 'Timesheet template ID. Use List Templates to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function holidayId<R extends boolean>({
	required,
	displayName = 'Holiday ID',
	description = 'Holiday ID. Use List Holidays to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function sharedReportId<R extends boolean>({
	required,
	displayName = 'Shared Report ID',
	description = 'Shared report ID. Use List Shared Reports to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function customFieldId<R extends boolean>({
	required,
	displayName = 'Custom Field ID',
	description = 'Custom field ID. Use List Custom Fields to find it.',
}: PropParams<R>) {
	return idProp({ required, displayName, description });
}

function page<R extends boolean>({
	required,
	displayName = 'Page',
	description = 'Page number, starting at 1. Default 1.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function pageSize<R extends boolean>({
	required,
	displayName = 'Page Size',
	description = 'Items per page, 1 to 5000. Default 50.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function rateAmount<R extends boolean>({
	required,
	displayName = 'Amount',
	description = 'Rate in cents, for example 2500 for 25.00.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function rateSince<R extends boolean>({
	required,
	displayName = 'Apply Since',
	description = 'Optional ISO 8601 datetime, for example 2026-01-01T00:00:00Z. Time entries from this moment on get the new rate. Empty = only new time entries.',
}: PropParams<R>) {
	return Property.DateTime({ displayName, description, required });
}

function includeApproved<R extends boolean>({
	required,
	displayName = 'Include Approved Entries',
	description = 'When Apply Since is set, also re-rate time entries that were already approved. Default false.',
}: PropParams<R>) {
	return Property.Checkbox({ displayName, description, required });
}

function tagIds<R extends boolean>({
	required,
	displayName = 'Tag IDs',
	description = 'Tag IDs to put on the time entry. Use List Tags to find them.',
}: PropParams<R>) {
	return Property.Array({ displayName, description, required });
}

function timeEntryIds<R extends boolean>({
	required,
	displayName = 'Time Entry IDs',
	description = 'Time entry IDs. Use List Time Entries to find them.',
}: PropParams<R>) {
	return Property.Array({ displayName, description, required });
}

function entryDescription<R extends boolean>({
	required,
	displayName = 'Description',
	description = 'What the time was spent on.',
}: PropParams<R>) {
	return Property.LongText({ displayName, description, required });
}

function dateRangeStart<R extends boolean>({
	required,
	displayName = 'From',
	description = 'Start of the report period, ISO 8601, for example 2026-10-01T00:00:00Z.',
}: PropParams<R>) {
	return Property.DateTime({ displayName, description, required });
}

function dateRangeEnd<R extends boolean>({
	required,
	displayName = 'To',
	description = 'End of the report period, ISO 8601, for example 2026-10-31T23:59:59Z.',
}: PropParams<R>) {
	return Property.DateTime({ displayName, description, required });
}

function idList<R extends boolean>({
	required,
	displayName,
	description,
}: PropParams<R> & { displayName: string }) {
	return Property.Array({ displayName, description, required });
}

function changeFeedEntityType<R extends boolean>({
	required,
	displayName = 'Record Type',
	description = 'Type of record to list changes for.',
}: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: CHANGE_FEED_TYPES.map((value) => ({ label: value, value })),
		},
	});
}

export const clockifyAiProps = {
	workspaceId,
	userId,
	projectId,
	taskId,
	clientId,
	tagId,
	userGroupId,
	timeEntryId,
	templateId,
	holidayId,
	sharedReportId,
	customFieldId,
	page,
	pageSize,
	rateAmount,
	rateSince,
	includeApproved,
	tagIds,
	timeEntryIds,
	entryDescription,
	dateRangeStart,
	dateRangeEnd,
	idList,
	changeFeedEntityType,
};
