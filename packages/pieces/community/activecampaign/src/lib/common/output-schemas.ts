import { OutputSchema } from '@activepieces/pieces-framework';

const contactFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Contact ID' },
	{ key: 'email', label: 'Email', format: 'email' },
	{ key: 'firstName', label: 'First Name' },
	{ key: 'lastName', label: 'Last Name' },
	{ key: 'phone', label: 'Phone' },
	{ key: 'orgid', label: 'Account ID' },
	{ key: 'cdate', label: 'Created At', format: 'datetime' },
	{ key: 'udate', label: 'Updated At', format: 'datetime' },
];

const rawContactFields: OutputSchema['fields'] = [
	...contactFields,
	{ key: 'orgname', label: 'Account Name' },
	{ key: 'links', label: 'Links', dynamicKey: true },
];

const sideLoadedContactFields: OutputSchema['fields'] = [...contactFields, { key: 'orgname', label: 'Account Name' }];

const fieldValueFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Field Value ID' },
	{ key: 'contact', label: 'Contact ID' },
	{ key: 'field', label: 'Field ID' },
	{ key: 'value', label: 'Value' },
	{ key: 'cdate', label: 'Created At', format: 'datetime' },
	{ key: 'udate', label: 'Updated At', format: 'datetime' },
];

const accountFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Account ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'accountUrl', label: 'Account URL', format: 'url' },
	{ key: 'createdTimestamp', label: 'Created At', format: 'datetime' },
	{ key: 'updatedTimestamp', label: 'Updated At', format: 'datetime' },
];

const accountCustomFieldValueFields: OutputSchema['fields'] = [
	{ key: 'customFieldId', label: 'Custom Field ID' },
	{ key: 'fieldValue', label: 'Value' },
];

const rawDealFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Deal ID' },
	{ key: 'title', label: 'Title' },
	{ key: 'description', label: 'Description' },
	{ key: 'value', label: 'Value (cents)', description: 'Integer cents; a number on create and a string on update.' },
	{ key: 'currency', label: 'Currency' },
	{ key: 'status', label: 'Status (0 open, 1 won, 2 lost)' },
	{ key: 'group', label: 'Pipeline ID' },
	{ key: 'stage', label: 'Stage ID' },
	{ key: 'owner', label: 'Owner User ID' },
	{ key: 'contact', label: 'Contact ID' },
	{ key: 'account', label: 'Account ID' },
	{ key: 'cdate', label: 'Created At', format: 'datetime' },
	{ key: 'mdate', label: 'Updated At', format: 'datetime' },
];

const dealSummaryFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Deal ID' },
	{ key: 'title', label: 'Title' },
	{ key: 'description', label: 'Description' },
	{ key: 'value', label: 'Value (cents)' },
	{ key: 'valueFormatted', label: 'Value' },
	{ key: 'currency', label: 'Currency' },
	{ key: 'status', label: 'Status', description: 'open, won or lost' },
	{ key: 'group', label: 'Pipeline ID' },
	{ key: 'stage', label: 'Stage ID' },
	{ key: 'owner', label: 'Owner User ID' },
	{ key: 'contact', label: 'Contact ID' },
	{ key: 'account', label: 'Account ID' },
	{ key: 'cdate', label: 'Created At', format: 'datetime' },
	{ key: 'mdate', label: 'Updated At', format: 'datetime' },
	{ key: 'isDisabled', label: 'Restricted', description: 'Set when the API user cannot manage the deal\'s pipeline; then only id and title are returned.' },
];

const taskFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Task ID' },
	{ key: 'title', label: 'Title' },
	{ key: 'note', label: 'Note', description: 'Text; null or empty when the task has no note.' },
	{ key: 'relid', label: 'Related Record ID' },
	{ key: 'reltype', label: 'Related Record Type' },
	{ key: 'duedate', label: 'Due At', format: 'datetime' },
	{ key: 'edate', label: 'Ends At', format: 'datetime' },
	{ key: 'status', label: 'Status (0 open, 1 complete)' },
	{ key: 'assignee', label: 'Assignee User ID', description: 'Null when the task is unassigned.' },
	{ key: 'dealTasktype', label: 'Task Type ID' },
	{ key: 'cdate', label: 'Created At', format: 'datetime' },
];

const noteFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Note ID' },
	{ key: 'note', label: 'Note' },
	{ key: 'reltype', label: 'Related Record Type' },
	{ key: 'relid', label: 'Related Record ID' },
	{ key: 'cdate', label: 'Created At', format: 'datetime' },
];

const contactListFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Membership ID' },
	{ key: 'list', label: 'List ID' },
	{ key: 'contact', label: 'Contact ID' },
	{ key: 'status', label: 'Status (1 subscribed, 2 unsubscribed)' },
	{ key: 'sdate', label: 'Subscribed At', format: 'datetime' },
	{ key: 'udate', label: 'Unsubscribed At', format: 'datetime' },
	{ key: 'sourceid', label: 'Source ID' },
];

const tagFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Tag ID' },
	{ key: 'tag', label: 'Name' },
	{ key: 'tagType', label: 'Type' },
	{ key: 'description', label: 'Description' },
	{ key: 'cdate', label: 'Created At', format: 'datetime' },
];

const pageFields: OutputSchema['fields'] = [
	{ key: 'total', label: 'Total Matches', format: 'number' },
	{ key: 'offset', label: 'Offset', format: 'number' },
	{ key: 'limit', label: 'Limit', format: 'number' },
	{ key: 'hasMore', label: 'Has More', format: 'boolean' },
];

const webhookFieldMapFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Field ID' },
	{ key: 'key', label: 'Field Name' },
	{ key: 'value', label: 'Value' },
];

const webhookContactFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Contact ID' },
	{ key: 'email', label: 'Email', format: 'email' },
	{ key: 'first_name', label: 'First Name' },
	{ key: 'last_name', label: 'Last Name' },
	{ key: 'phone', label: 'Phone' },
	{ key: 'ip', label: 'IP Address' },
	{ key: 'tags', label: 'Tags (comma separated)' },
	{ key: 'customer_acct_name', label: 'Account Name' },
	{ key: 'orgname', label: 'Organization Name' },
	{
		key: 'fields',
		label: 'Custom Fields',
		dynamicKey: true,
		description: 'The contact\'s custom field values in field order (an array of values); with more than 21 fields it arrives as an object keyed "0", "1", …',
	},
];

const webhookEventFields: OutputSchema['fields'] = [
	{ key: 'type', label: 'Event Type' },
	{ key: 'date_time', label: 'Event Time', format: 'datetime' },
	{ key: 'initiated_from', label: 'Initiated From' },
	{ key: 'initiated_by', label: 'Initiated By' },
	{ key: 'list', label: 'List', description: 'A list ID string ("0" when the event has no list); on unsubscribe an array of { id, name }.' },
];

const webhookContactAccountFields: OutputSchema['fields'] = [
	{ key: 'customer_acct_name', label: 'Account Name' },
	{ key: 'customer_acct_id', label: 'Account ID' },
	{ key: 'orgname', label: 'Organization Name' },
];

const activeSubscriptionsField: OutputSchema['fields'][number] = {
	key: 'active_subscriptions',
	label: 'Active List IDs',
	description: 'IDs of the lists the contact is still subscribed to ("0" when none).',
};

const webhookDealFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Deal ID' },
	{ key: 'title', label: 'Title' },
	{ key: 'create_date', label: 'Created At (account time)' },
	{ key: 'create_date_iso', label: 'Created At', format: 'datetime' },
	{ key: 'orgid', label: 'Account ID' },
	{ key: 'orgname', label: 'Account Name' },
	{ key: 'stageid', label: 'Stage ID' },
	{ key: 'stage_title', label: 'Stage' },
	{ key: 'pipelineid', label: 'Pipeline ID' },
	{ key: 'pipeline_title', label: 'Pipeline' },
	{ key: 'value', label: 'Value (formatted)', description: 'The amount with thousands separators, such as 1,044,055.00.' },
	{ key: 'value_raw', label: 'Value', description: 'The amount as a plain decimal, such as 0.29 (not cents).' },
	{ key: 'currency', label: 'Currency' },
	{ key: 'currency_symbol', label: 'Currency Symbol' },
	{ key: 'owner', label: 'Owner User ID' },
	{ key: 'owner_firstname', label: 'Owner First Name' },
	{ key: 'owner_lastname', label: 'Owner Last Name' },
	{ key: 'contactid', label: 'Contact ID' },
	{ key: 'contact_email', label: 'Contact Email', format: 'email' },
	{ key: 'contact_firstname', label: 'Contact First Name' },
	{ key: 'contact_lastname', label: 'Contact Last Name' },
	{ key: 'status', label: 'Status (0 open, 1 won, 2 lost)' },
	{ key: 'fields', label: 'Custom Fields', dynamicKey: true, labelKey: 'key', children: webhookFieldMapFields },
];

const webhookTaskFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Task ID' },
	{ key: 'type_id', label: 'Task Type ID' },
	{ key: 'type_title', label: 'Task Type' },
	{ key: 'title', label: 'Title' },
	{ key: 'note', label: 'Note', description: 'Only present when the task has a note.' },
	{ key: 'duedate', label: 'Due At (account time)' },
	{ key: 'duedate_iso', label: 'Due At', format: 'datetime' },
	{ key: 'edate', label: 'Ends At (account time)' },
	{ key: 'edate_iso', label: 'Ends At', format: 'datetime' },
];

const webhookCompletedTaskFields: OutputSchema['fields'] = [
	...webhookTaskFields,
	{ key: 'donedate', label: 'Completed At (account time)' },
	{ key: 'donedate_iso', label: 'Completed At', format: 'datetime' },
];

const webhookAccountFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Account ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'account_url', label: 'Account URL', format: 'url' },
	{ key: 'created_timestamp', label: 'Created At', format: 'datetime' },
	{ key: 'updated_timestamp', label: 'Updated At', format: 'datetime' },
	{ key: 'fields', label: 'Custom Fields', dynamicKey: true, labelKey: 'key', children: webhookFieldMapFields },
];

const webhookCampaignFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Campaign ID' },
	{ key: 'name', label: 'Campaign Name' },
	{ key: 'status', label: 'Campaign Status', description: 'ActiveCampaign campaign status code; "5" means sent.' },
	{ key: 'type', label: 'Campaign Type', description: 'For example single for a one-off send.' },
	{ key: 'recipients', label: 'Recipients' },
];

const webhookAccountNumberField: OutputSchema['fields'][number] = { key: 'account_id', label: 'ActiveCampaign Account Number' };

function webhookSchema(extra: OutputSchema['fields']): OutputSchema {
	return { fields: [...webhookEventFields, ...extra] };
}

export const createContactOutputSchema: OutputSchema = {
	fields: [
		{ key: 'contact', label: 'Contact', description: 'Partial view of the raw ActiveCampaign record; the response carries more keys (links, tracking and audit fields) and side-loaded collections.', children: rawContactFields },
		{ key: 'fieldValues', label: 'Custom Field Values', labelKey: 'field', listItems: fieldValueFields },
	],
};

export const updateContactOutputSchema: OutputSchema = createContactOutputSchema;

export const addTagToContactOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'contactTag',
			label: 'Contact Tag',
			children: [
				{ key: 'id', label: 'Association ID' },
				{ key: 'contact', label: 'Contact ID' },
				{ key: 'tag', label: 'Tag ID' },
				{ key: 'cdate', label: 'Created At', format: 'datetime' },
			],
		},
		{ key: 'contacts', label: 'Contacts', labelKey: 'email', description: 'Partial view of the raw ActiveCampaign record; the response carries more keys (links, tracking and audit fields) and side-loaded collections.', listItems: sideLoadedContactFields },
		{
			key: 'tags',
			label: 'Tags',
			labelKey: 'tag',
			listItems: [
				{ key: 'id', label: 'Tag ID' },
				{ key: 'tag', label: 'Name' },
				{ key: 'tagType', label: 'Type' },
				{ key: 'description', label: 'Description' },
				{ key: 'subscriber_count', label: 'Contacts With Tag' },
			],
		},
	],
};

export const addContactToAccountOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'accountContact',
			label: 'Account Contact',
			description: 'Partial view of the raw ActiveCampaign record; the response carries more keys (links, tracking and audit fields) and side-loaded collections.',
			children: [
				{ key: 'id', label: 'Association ID' },
				{ key: 'contact', label: 'Contact ID' },
				{ key: 'account', label: 'Account ID' },
				{ key: 'jobTitle', label: 'Job Title' },
				{ key: 'createdTimestamp', label: 'Created At', format: 'datetime' },
				{ key: 'updatedTimestamp', label: 'Updated At', format: 'datetime' },
			],
		},
		{ key: 'accounts', label: 'Accounts', labelKey: 'name', listItems: [...accountFields, { key: 'owner', label: 'Owner User ID' }] },
	],
};

export const accountOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'account',
			label: 'Account',
			description: 'Partial view of the raw ActiveCampaign record; the response carries more keys (links, tracking and audit fields) and side-loaded collections.',
			children: [
				...accountFields,
				{ key: 'owner', label: 'Owner User ID' },
				{ key: 'fields', label: 'Custom Fields', labelKey: 'customFieldId', listItems: accountCustomFieldValueFields },
			],
		},
	],
};

export const subscribeOrUnsubscribeOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'contactList',
			label: 'List Membership',
			description: 'Partial view of the raw ActiveCampaign record; the response carries more keys (links, tracking and audit fields) and side-loaded collections.',
			children: [
				...contactListFields,
				{ key: 'first_name', label: 'First Name' },
				{ key: 'last_name', label: 'Last Name' },
				{ key: 'unsubreason', label: 'Unsubscribe Reason' },
				{ key: 'campaign', label: 'Campaign ID' },
			],
		},
		{ key: 'contacts', label: 'Contacts', labelKey: 'email', description: 'Partial view of the raw ActiveCampaign record; the response carries more keys (links, tracking and audit fields) and side-loaded collections.', listItems: sideLoadedContactFields },
	],
};

export const findContactOutputSchema: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', format: 'boolean' },
		{ key: 'contact', label: 'Contact', description: 'Null when no contact has the email. Partial view of the raw ActiveCampaign record; the response carries more keys (links, tracking and audit fields) and side-loaded collections.', children: rawContactFields },
	],
};

export const rawDealOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'deal',
			label: 'Deal',
			description: 'Partial view of the raw ActiveCampaign record; the response carries more keys (links, tracking and audit fields) and side-loaded collections.',
			children: [
				...rawDealFields,
				{ key: 'isDisabled', label: 'Restricted', format: 'boolean' },
				{ key: 'fields', label: 'Custom Field Values', description: 'Deal custom field values; empty when none are set.' },
			],
		},
		{ key: 'contacts', label: 'Contacts', labelKey: 'email', description: 'Present when the deal has a contact.', listItems: sideLoadedContactFields },
		{
			key: 'dealGroups',
			label: 'Pipelines',
			labelKey: 'title',
			description: 'Present on create.',
			listItems: [
				{ key: 'id', label: 'Pipeline ID' },
				{ key: 'title', label: 'Title' },
				{ key: 'currency', label: 'Currency' },
				{ key: 'autoassign', label: 'Auto-assign Owners', description: '"0" when deals in this pipeline need an owner.' },
			],
		},
		{
			key: 'dealStages',
			label: 'Stages',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'Stage ID' },
				{ key: 'title', label: 'Title' },
				{ key: 'group', label: 'Pipeline ID' },
				{ key: 'order', label: 'Order' },
			],
		},
	],
};

export const rawNoteOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'note',
			label: 'Note',
			description: 'Partial view of the raw ActiveCampaign record; the response carries more keys (links, tracking and audit fields) and side-loaded collections.',
			children: [
				...noteFields,
				{ key: 'mdate', label: 'Updated At', format: 'datetime' },
				{ key: 'userid', label: 'Author User ID' },
				{ key: 'owner', label: 'Attached To', children: [{ key: 'type', label: 'Type' }, { key: 'id', label: 'ID' }] },
			],
		},
		{ key: 'contacts', label: 'Contacts', labelKey: 'email', description: 'Present when the note is on a contact.', listItems: sideLoadedContactFields },
	],
};

export const rawTaskOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'dealTask',
			label: 'Task',
			description: 'Partial view of the raw ActiveCampaign record; the response carries more keys (links, tracking and audit fields) and side-loaded collections.',
			children: [
				...taskFields,
				{ key: 'udate', label: 'Updated At', format: 'datetime' },
				{ key: 'user', label: 'Created By User ID' },
				{ key: 'assigned_date', label: 'Assigned At', format: 'datetime' },
				{ key: 'owner', label: 'Attached To', children: [{ key: 'type', label: 'Type' }, { key: 'id', label: 'ID' }] },
			],
		},
		{
			key: 'dealTasktypes',
			label: 'Task Types',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'Task Type ID' },
				{ key: 'title', label: 'Title' },
			],
		},
		{ key: 'contacts', label: 'Contacts', labelKey: 'email', description: 'Present when the task is on a contact.', listItems: sideLoadedContactFields },
	],
};

export const removeTagOutputSchema: OutputSchema = {
	fields: [
		{ key: 'removed', label: 'Removed', format: 'boolean' },
		{ key: 'contactId', label: 'Contact ID' },
		{ key: 'tagId', label: 'Tag ID' },
	],
};

export const rawContactAutomationOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'contactAutomation',
			label: 'Automation Run',
			description: 'Partial view of the raw ActiveCampaign record; the response carries more keys (links, tracking and audit fields) and side-loaded collections.',
			children: [
				{ key: 'id', label: 'Run ID' },
				{ key: 'contact', label: 'Contact ID' },
				{ key: 'automation', label: 'Automation ID' },
				{ key: 'status', label: 'Status (1 in progress, 2 completed)' },
				{ key: 'completedElements', label: 'Completed Steps' },
				{ key: 'totalElements', label: 'Total Steps' },
			],
		},
		{ key: 'contacts', label: 'Contacts', labelKey: 'email', listItems: sideLoadedContactFields },
	],
};

export const listContactsOutputSchema: OutputSchema = {
	fields: [{ key: 'items', label: 'Contacts', labelKey: 'email', listItems: contactFields }, ...pageFields],
};

export const getContactOutputSchema: OutputSchema = {
	fields: [
		{ key: 'contact', label: 'Contact', children: contactFields },
		{
			key: 'fieldValues',
			label: 'Custom Field Values',
			labelKey: 'field',
			listItems: [
				{ key: 'id', label: 'Field Value ID' },
				{ key: 'field', label: 'Field ID' },
				{ key: 'value', label: 'Value', description: 'As ActiveCampaign stores it; a dropdown value can come back as the option text (sent fr, returned French).' },
			],
		},
		{
			key: 'tags',
			label: 'Tags',
			labelKey: 'tag',
			listItems: [
				{ key: 'id', label: 'Association ID' },
				{ key: 'tag', label: 'Tag ID' },
			],
		},
		{
			key: 'lists',
			label: 'Lists',
			labelKey: 'list',
			listItems: [
				{ key: 'list', label: 'List ID' },
				{ key: 'status', label: 'Status', description: 'unconfirmed, subscribed, unsubscribed or bounced' },
			],
		},
	],
};

export const createOrUpdateContactOutputSchema: OutputSchema = {
	fields: [
		{ key: 'created', label: 'Created', format: 'boolean' },
		{ key: 'contact', label: 'Contact', children: contactFields },
		{
			key: 'fieldValues',
			label: 'Custom Field Values',
			labelKey: 'field',
			listItems: [
				{ key: 'field', label: 'Field ID' },
				{ key: 'value', label: 'Value', description: 'As ActiveCampaign stores it; a dropdown value can come back as the option text (sent fr, returned French).' },
			],
		},
	],
};

export const deleteContactOutputSchema: OutputSchema = {
	fields: [
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
		{ key: 'contactId', label: 'Contact ID' },
	],
};

export const listTagsOutputSchema: OutputSchema = {
	fields: [{ key: 'items', label: 'Tags', labelKey: 'tag', listItems: tagFields }, ...pageFields],
};

export const createTagOutputSchema: OutputSchema = { fields: tagFields };

export const addTagToContactAiOutputSchema: OutputSchema = {
	fields: [
		{ key: 'associationId', label: 'Association ID' },
		{ key: 'contactId', label: 'Contact ID' },
		{ key: 'tagId', label: 'Tag ID' },
		{ key: 'created', label: 'Created', format: 'boolean' },
	],
};

export const listListsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Lists',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'List ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'stringid', label: 'String ID' },
				{ key: 'cdate', label: 'Created At', format: 'datetime' },
			],
		},
		...pageFields,
	],
};

export const listMembershipOutputSchema: OutputSchema = {
	fields: [
		{ key: 'contactId', label: 'Contact ID' },
		{ key: 'listId', label: 'List ID' },
		{ key: 'status', label: 'Status' },
		{ key: 'contactList', label: 'List Membership', children: contactListFields },
	],
};

export const listContactCustomFieldsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Custom Fields',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'Field ID' },
				{ key: 'title', label: 'Title' },
				{ key: 'type', label: 'Type' },
				{ key: 'perstag', label: 'Personalization Tag' },
				{
					key: 'options',
					label: 'Options',
					labelKey: 'label',
					listItems: [
						{ key: 'value', label: 'Value' },
						{ key: 'label', label: 'Label' },
					],
				},
			],
		},
		{ key: 'total', label: 'Total', format: 'number' },
	],
};

export const listAccountCustomFieldsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Custom Fields',
			labelKey: 'fieldLabel',
			listItems: [
				{ key: 'id', label: 'Field ID' },
				{ key: 'fieldLabel', label: 'Label' },
				{ key: 'fieldType', label: 'Type' },
				{ key: 'fieldOptions', label: 'Options' },
			],
		},
		{ key: 'total', label: 'Total', format: 'number' },
	],
};

export const listAccountsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Accounts',
			labelKey: 'name',
			listItems: [...accountFields, { key: 'contactCount', label: 'Contacts', format: 'number' }, { key: 'dealCount', label: 'Deals', format: 'number' }],
		},
		...pageFields,
	],
};

export const accountAiOutputSchema: OutputSchema = {
	fields: [
		...accountFields,
		{
			key: 'fields',
			label: 'Custom Fields',
			labelKey: 'customFieldId',
			description: 'Only present when ActiveCampaign returns custom field values in the response.',
			listItems: accountCustomFieldValueFields,
		},
	],
};

export const associateContactWithAccountOutputSchema: OutputSchema = {
	fields: [
		{ key: 'associationId', label: 'Association ID' },
		{ key: 'contactId', label: 'Contact ID' },
		{ key: 'accountId', label: 'Account ID' },
		{ key: 'jobTitle', label: 'Job Title' },
	],
};

export const listPipelinesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Pipelines',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'Pipeline ID' },
				{ key: 'title', label: 'Title' },
				{ key: 'currency', label: 'Currency' },
				{ key: 'allgroups', label: 'All Groups Have Access' },
				{ key: 'autoassign', label: 'Auto-assign Setting' },
			],
		},
		{ key: 'total', label: 'Total', format: 'number' },
	],
};

export const listDealStagesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Stages',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'Stage ID' },
				{ key: 'title', label: 'Title' },
				{ key: 'group', label: 'Pipeline ID' },
				{ key: 'order', label: 'Order' },
			],
		},
		{ key: 'total', label: 'Total', format: 'number' },
	],
};

export const listDealsOutputSchema: OutputSchema = {
	fields: [{ key: 'items', label: 'Deals', labelKey: 'title', listItems: dealSummaryFields }, ...pageFields],
};

export const dealAiOutputSchema: OutputSchema = {
	fields: [{ key: 'deal', label: 'Deal', children: dealSummaryFields }],
};

export const noteAiOutputSchema: OutputSchema = { fields: noteFields };

export const listTaskTypesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Task Types',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'Task Type ID' },
				{ key: 'title', label: 'Title' },
			],
		},
		{ key: 'total', label: 'Total', format: 'number' },
	],
};

export const taskAiOutputSchema: OutputSchema = { fields: taskFields };

export const listAutomationsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Automations',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'Automation ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'status', label: 'Status (1 active, 2 inactive)' },
				{ key: 'entered', label: 'Contacts Entered', format: 'number' },
				{ key: 'exited', label: 'Contacts Exited', format: 'number' },
				{ key: 'cdate', label: 'Created At', format: 'datetime' },
				{ key: 'mdate', label: 'Updated At', format: 'datetime' },
			],
		},
		...pageFields,
	],
};

export const addContactToAutomationAiOutputSchema: OutputSchema = {
	fields: [
		{ key: 'contactAutomationId', label: 'Automation Run ID' },
		{ key: 'contactId', label: 'Contact ID' },
		{ key: 'automationId', label: 'Automation ID' },
		{ key: 'status', label: 'Status' },
	],
};

export const removeContactFromAutomationOutputSchema: OutputSchema = {
	fields: [
		{ key: 'removed', label: 'Removed', format: 'boolean' },
		{ key: 'contactId', label: 'Contact ID' },
		{ key: 'automationId', label: 'Automation ID' },
		{ key: 'contactAutomationIds', label: 'Removed Run IDs' },
	],
};

export const listUsersOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Users',
			labelKey: 'email',
			listItems: [
				{ key: 'id', label: 'User ID' },
				{ key: 'username', label: 'Username' },
				{ key: 'firstName', label: 'First Name' },
				{ key: 'lastName', label: 'Last Name' },
				{ key: 'email', label: 'Email', format: 'email' },
			],
		},
		{ key: 'total', label: 'Total', format: 'number' },
	],
};

export const dealTaskTriggerOutputSchema = webhookSchema([
	{ key: 'contact', label: 'Contact', children: webhookContactFields },
	...webhookContactAccountFields,
	{ key: 'deal', label: 'Deal', children: webhookDealFields },
	{ key: 'task', label: 'Task', children: webhookTaskFields },
]);

export const dealTaskCompletedTriggerOutputSchema = webhookSchema([
	{ key: 'contact', label: 'Contact', children: webhookContactFields },
	...webhookContactAccountFields,
	{ key: 'deal', label: 'Deal', children: webhookDealFields },
	{ key: 'task', label: 'Task', children: webhookCompletedTaskFields },
]);

export const contactNoteTriggerOutputSchema = webhookSchema([
	{ key: 'note', label: 'Note' },
	{ key: 'contact', label: 'Contact', children: webhookContactFields },
	...webhookContactAccountFields,
]);

export const contactTaskTriggerOutputSchema = webhookSchema([
	{ key: 'contact', label: 'Contact', children: webhookContactFields },
	...webhookContactAccountFields,
	{ key: 'task', label: 'Task', children: webhookTaskFields },
]);

export const dealTriggerOutputSchema = webhookSchema([
	{ key: 'contact', label: 'Contact', children: webhookContactFields },
	...webhookContactAccountFields,
	{ key: 'deal', label: 'Deal', children: webhookDealFields },
	{ key: 'updated_fields', label: 'Updated Fields', description: 'Names of the changed deal fields; sent on deal_update events.' },
]);

export const accountTriggerOutputSchema = webhookSchema([
	{ key: 'account', label: 'Account', children: webhookAccountFields },
	{ key: 'updated_fields', label: 'Updated Fields' },
]);

export const dealNoteTriggerOutputSchema = webhookSchema([
	{
		key: 'note',
		label: 'Note',
		children: [
			{ key: 'id', label: 'Note ID' },
			{ key: 'text', label: 'Text' },
		],
	},
	{ key: 'deal', label: 'Deal', children: webhookDealFields },
]);

export const contactTagTriggerOutputSchema = webhookSchema([
	{ key: 'contact', label: 'Contact', children: webhookContactFields },
	...webhookContactAccountFields,
	{ key: 'tag', label: 'Tag' },
]);

export const updatedContactTriggerOutputSchema = webhookSchema([
	{ key: 'contact', label: 'Contact', children: webhookContactFields },
	...webhookContactAccountFields,
]);

export const campaignLinkClickedTriggerOutputSchema = webhookSchema([
	{ key: 'contact', label: 'Contact', children: webhookContactFields },
	...webhookContactAccountFields,
	webhookAccountNumberField,
	{
		key: 'campaign',
		label: 'Campaign',
		children: [
			...webhookCampaignFields,
			{
				key: 'message',
				label: 'Message',
				children: [
					{ key: 'id', label: 'Message ID' },
					{ key: 'subject', label: 'Subject' },
				],
			},
		],
	},
	{
		key: 'link',
		label: 'Link',
		children: [
			{ key: 'id', label: 'Link ID' },
			{ key: 'url', label: 'URL', format: 'url' },
		],
	},
]);

export const campaignBounceTriggerOutputSchema = webhookSchema([
	{ key: 'contact', label: 'Contact', children: webhookContactFields },
	...webhookContactAccountFields,
	webhookAccountNumberField,
	{ key: 'campaign', label: 'Campaign', children: webhookCampaignFields },
	{
		key: 'bounce',
		label: 'Bounce',
		children: [
			{ key: 'type', label: 'Bounce Type', description: 'hard or soft.' },
			{ key: 'code', label: 'Bounce Code', description: 'SMTP status code, such as 5.1.1.' },
			{ key: 'description', label: 'Description', description: 'The receiving mail server\'s bounce text.' },
		],
	},
]);

export const contactSubscribedTriggerOutputSchema = webhookSchema([
	{ key: 'contact', label: 'Contact', children: webhookContactFields },
	...webhookContactAccountFields,
	activeSubscriptionsField,
]);

export const contactUnsubscribedTriggerOutputSchema = webhookSchema([
	{ key: 'contact', label: 'Contact', children: webhookContactFields },
	...webhookContactAccountFields,
	{ key: 'account_id', label: 'ActiveCampaign Account Number' },
	activeSubscriptionsField,
	{
		key: 'campaign',
		label: 'Campaign',
		description: 'Only when the contact used the unsubscribe link in a campaign email.',
		children: [
			{ key: 'id', label: 'Campaign ID' },
			{ key: 'name', label: 'Campaign Name' },
		],
	},
	{
		key: 'unsubscribe',
		label: 'Unsubscribe',
		description: 'Only when the contact used the unsubscribe link in a campaign email.',
		children: [{ key: 'reason', label: 'Unsubscribe Reason', description: 'The reason the contact gave, if any.' }],
	},
]);
