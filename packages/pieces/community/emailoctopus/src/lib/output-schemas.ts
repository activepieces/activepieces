import { OutputSchema } from '@activepieces/pieces-framework';

const contactFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Contact ID' },
	{ key: 'email_address', label: 'Email Address', format: 'email' },
	{ key: 'fields', label: 'Custom Fields', dynamicKey: true },
	{ key: 'tags', label: 'Tags' },
	{ key: 'status', label: 'Status' },
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'last_updated_at', label: 'Last Updated At', format: 'datetime' },
];

const fieldFields: OutputSchema['fields'] = [
	{ key: 'label', label: 'Label' },
	{ key: 'tag', label: 'Tag' },
	{ key: 'type', label: 'Type' },
	{ key: 'fallback', label: 'Fallback' },
];

const listFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'List ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'double_opt_in', label: 'Double Opt-In', format: 'boolean' },
	{ key: 'fields', label: 'Fields', labelKey: 'label', listItems: fieldFields },
	{ key: 'tags', label: 'Tags' },
	{
		key: 'counts',
		label: 'Contact Counts',
		listItems: [
			{ key: 'pending', label: 'Pending', format: 'number' },
			{ key: 'subscribed', label: 'Subscribed', format: 'number' },
			{ key: 'unsubscribed', label: 'Unsubscribed', format: 'number' },
		],
	},
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'last_updated_at', label: 'Last Updated At', format: 'datetime' },
];

const campaignFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Campaign ID' },
	{ key: 'status', label: 'Status' },
	{ key: 'name', label: 'Name' },
	{ key: 'subject', label: 'Subject' },
	{ key: 'preview_text', label: 'Preview Text' },
	{ key: 'to', label: 'Recipient List IDs' },
	{
		key: 'from',
		label: 'From',
		children: [
			{ key: 'name', label: 'Name' },
			{ key: 'email_address', label: 'Email Address', format: 'email' },
		],
	},
	{
		key: 'content',
		label: 'Content',
		children: [{ key: 'html', label: 'HTML', format: 'html' }],
	},
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'sent_at', label: 'Sent At', format: 'datetime' },
];

const pagingField: OutputSchema['fields'][number] = {
	key: 'paging',
	label: 'Paging',
	children: [
		{
			key: 'next',
			label: 'Next Page',
			children: [
				{ key: 'url', label: 'URL', format: 'url' },
				{ key: 'starting_after', label: 'Starting After Cursor' },
			],
		},
	],
};

const webhookEventFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Event ID' },
	{ key: 'type', label: 'Event Type' },
	{ key: 'list_id', label: 'List ID' },
	{ key: 'contact_id', label: 'Contact ID' },
	{ key: 'contact_email_address', label: 'Contact Email Address', format: 'email' },
	{ key: 'occurred_at', label: 'Occurred At', format: 'datetime' },
];

export const contactOutputSchema: OutputSchema = { fields: contactFields };

export const listContactsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'data', label: 'Contacts', labelKey: 'email_address', listItems: contactFields },
		pagingField,
	],
};

export const findContactOutputSchema: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', format: 'boolean' },
		{ key: 'result', label: 'Contact', children: contactFields },
	],
};

export const deleteContactOutputSchema: OutputSchema = {
	fields: [
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
		{ key: 'list_id', label: 'List ID' },
		{ key: 'contact', label: 'Contact' },
	],
};

export const updateContactsBatchOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'All Succeeded', format: 'boolean' },
		{ key: 'updated_count', label: 'Updated Count', format: 'number' },
		{
			key: 'updated',
			label: 'Updated Contacts',
			labelKey: 'email_address',
			listItems: contactFields,
		},
		{
			key: 'failed',
			label: 'Failed',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'Contact ID' },
				{ key: 'type', label: 'Error Type', format: 'url' },
				{ key: 'title', label: 'Title' },
				{ key: 'detail', label: 'Detail' },
				{ key: 'status', label: 'Status', format: 'number' },
			],
		},
	],
};

export const listOutputSchema: OutputSchema = { fields: listFields };

export const listListsOutputSchema: OutputSchema = {
	fields: [{ key: 'data', label: 'Lists', labelKey: 'name', listItems: listFields }, pagingField],
};

export const deleteListOutputSchema: OutputSchema = {
	fields: [
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
		{ key: 'list_id', label: 'List ID' },
	],
};

export const fieldOutputSchema: OutputSchema = { fields: fieldFields };

export const createFieldOutputSchema: OutputSchema = {
	fields: [...fieldFields, { key: 'choices', label: 'Choices' }],
};

export const deleteFieldOrTagOutputSchema: OutputSchema = {
	fields: [
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
		{ key: 'list_id', label: 'List ID' },
		{ key: 'tag', label: 'Tag' },
	],
};

export const tagOutputSchema: OutputSchema = {
	fields: [{ key: 'tag', label: 'Tag' }],
};

export const listTagsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'data', label: 'Tags', labelKey: 'tag', listItems: [{ key: 'tag', label: 'Tag' }] },
		pagingField,
	],
};

export const campaignOutputSchema: OutputSchema = { fields: campaignFields };

export const listCampaignsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'data', label: 'Campaigns', labelKey: 'name', listItems: campaignFields },
		pagingField,
	],
};

export const campaignContactReportOutputSchema: OutputSchema = {
	fields: [
		{ key: 'status', label: 'Status' },
		{
			key: 'data',
			label: 'Contacts',
			labelKey: 'contact_email_address',
			listItems: [
				{ key: 'contact_id', label: 'Contact ID' },
				{ key: 'contact_email_address', label: 'Contact Email Address', format: 'email' },
				{ key: 'occurred_at', label: 'Occurred At', format: 'datetime' },
			],
		},
		pagingField,
	],
};

export const campaignLinksReportOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'data',
			label: 'Links',
			labelKey: 'url',
			listItems: [
				{ key: 'url', label: 'URL', format: 'url' },
				{ key: 'clicked_total', label: 'Total Clicks', format: 'number' },
				{ key: 'clicked_unique', label: 'Unique Clicks', format: 'number' },
			],
		},
	],
};

export const campaignSummaryReportOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Campaign ID' },
		{ key: 'sent', label: 'Sent', format: 'number' },
		{
			key: 'bounced',
			label: 'Bounced',
			children: [
				{ key: 'soft', label: 'Soft Bounces', format: 'number' },
				{ key: 'hard', label: 'Hard Bounces', format: 'number' },
			],
		},
		{
			key: 'opened',
			label: 'Opened',
			children: [
				{ key: 'total', label: 'Total Opens', format: 'number' },
				{ key: 'unique', label: 'Unique Opens', format: 'number' },
			],
		},
		{
			key: 'clicked',
			label: 'Clicked',
			children: [
				{ key: 'total', label: 'Total Clicks', format: 'number' },
				{ key: 'unique', label: 'Unique Clicks', format: 'number' },
			],
		},
		{ key: 'complained', label: 'Complaints', format: 'number' },
		{ key: 'unsubscribed', label: 'Unsubscribes', format: 'number' },
	],
};

export const contactEventTriggerOutputSchema: OutputSchema = {
	fields: [
		...webhookEventFields,
		{ key: 'contact_status', label: 'Contact Status' },
		{ key: 'contact_tags', label: 'Contact Tags' },
		{ key: 'contact_fields', label: 'Contact Custom Fields', dynamicKey: true },
	],
};

export const emailEventTriggerOutputSchema: OutputSchema = {
	fields: [
		...webhookEventFields,
		{ key: 'campaign_id', label: 'Campaign ID' },
		{ key: 'contact_status', label: 'Contact Status' },
	],
};

export const startAutomationOutputSchema: OutputSchema = {
	fields: [
		{ key: 'queued', label: 'Queued', format: 'boolean' },
		{ key: 'automation_id', label: 'Automation ID' },
		{ key: 'contact_id', label: 'Contact ID' },
	],
};
