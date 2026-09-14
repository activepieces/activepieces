import { OutputSchema } from '@activepieces/pieces-framework';

const contactSummaryFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Contact ID', format: 'number' },
	{ key: 'email', label: 'Email', format: 'email' },
	{
		key: 'attributes',
		label: 'Attributes',
		description: 'Account specific contact attributes such as FIRSTNAME or SMS.',
		dynamicKey: true,
	},
	{ key: 'listIds', label: 'List IDs', description: 'Lists the contact belongs to.' },
	{ key: 'emailBlacklisted', label: 'Email Blacklisted', format: 'boolean' },
	{ key: 'smsBlacklisted', label: 'SMS Blacklisted', format: 'boolean' },
	{ key: 'whatsappBlacklisted', label: 'WhatsApp Blacklisted', format: 'boolean' },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
	{ key: 'modifiedAt', label: 'Modified At', format: 'datetime' },
];

const contactFields: OutputSchema['fields'] = [
	...contactSummaryFields,
	{
		key: 'statistics',
		label: 'Statistics',
		description: 'Engagement counters, populated once the contact has campaign activity.',
	},
];

const marketingEventFields: OutputSchema['fields'] = [
	{ key: 'event', label: 'Event' },
	{ key: 'email', label: 'Email', format: 'email' },
	{
		key: 'id',
		label: 'Webhook ID',
		description: 'The Brevo webhook that delivered this event, not the contact id.',
		format: 'number',
	},
	{ key: 'date', label: 'Date', format: 'datetime' },
	{ key: 'ts', label: 'Timestamp (seconds)', format: 'number' },
];

const transactionalEventFields: OutputSchema['fields'] = [
	{ key: 'event', label: 'Event' },
	{ key: 'email', label: 'Recipient', format: 'email' },
	{ key: 'subject', label: 'Subject' },
	{ key: 'message-id', label: 'Message ID' },
	{ key: 'uuid', label: 'Event UUID' },
	{ key: 'sender_email', label: 'Sender', format: 'email' },
	{ key: 'tags', label: 'Tags' },
	{ key: 'sending_ip', label: 'Sending IP' },
	{ key: 'date', label: 'Date', format: 'datetime' },
	{ key: 'ts_event', label: 'Event Timestamp (seconds)', format: 'number' },
	{ key: 'ts_epoch', label: 'Event Timestamp', format: 'datetime' },
	{
		key: 'id',
		label: 'Webhook ID',
		description: 'The Brevo webhook that delivered this event, not the message id.',
		format: 'number',
	},
];

const deliveryEventFields: OutputSchema['fields'] = [
	...transactionalEventFields,
	{
		key: 'reason',
		label: 'Reason',
		description: 'Why the message reached this state, for example sent or an MX lookup failure.',
	},
];

const engagementEventFields: OutputSchema['fields'] = [
	...transactionalEventFields,
	{ key: 'user_agent', label: 'User Agent' },
	{ key: 'device_used', label: 'Device Used' },
	{
		key: 'contact_id',
		label: 'Contact ID',
		description: 'The Brevo contact that engaged. Unlike the top level id, this is a real contact id.',
		format: 'number',
	},
];

const identifierResultFields: OutputSchema['fields'] = [
	{ key: 'success', label: 'Success', format: 'boolean' },
	{ key: 'identifier', label: 'Contact Identifier', description: 'The identifier the call was made with, echoed back.' },
];

const contactListSummaryFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'List ID', format: 'number' },
	{ key: 'name', label: 'Name' },
	{ key: 'folderId', label: 'Folder ID', format: 'number' },
	{ key: 'uniqueSubscribers', label: 'Unique Subscribers', format: 'number' },
	{ key: 'totalSubscribers', label: 'Total Subscribers', format: 'number' },
	{ key: 'totalBlacklisted', label: 'Total Blacklisted', format: 'number' },
];

const contactListDetailFields: OutputSchema['fields'] = [
	...contactListSummaryFields,
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
	{ key: 'dynamicList', label: 'Dynamic List', format: 'boolean' },
	{
		key: 'startDate',
		label: 'Stats Window Start',
		description: 'Start of the period the campaign stats cover.',
		format: 'datetime',
	},
	{
		key: 'endDate',
		label: 'Stats Window End',
		description: 'End of the period the campaign stats cover.',
		format: 'datetime',
	},
	{
		key: 'campaignStats',
		label: 'Campaign Stats',
		description: 'Per campaign statistics for this list, empty until a campaign has been sent to it.',
	},
];

const contactAttributeFields: OutputSchema['fields'] = [
	{ key: 'name', label: 'Name', description: 'The attribute key as used in contact attributes, for example FIRSTNAME.' },
	{ key: 'category', label: 'Category', description: 'normal, category, global, transactional or calculated.' },
	{ key: 'type', label: 'Type', description: 'text, date, float, boolean or id. Absent on category attributes.' },
	{ key: 'field_key', label: 'Field Key' },
	{
		key: 'calculatedValue',
		label: 'Calculated Value',
		description: 'The formula behind a global or calculated attribute.',
	},
	{
		key: 'enumeration',
		label: 'Allowed Values',
		description: 'Only on category attributes.',
		labelKey: 'label',
		listItems: [
			{ key: 'value', label: 'Value', format: 'number' },
			{ key: 'valueStr', label: 'Value Key' },
			{ key: 'label', label: 'Label' },
		],
	},
];

export const createOrUpdateContactActionOutputSchema: OutputSchema = {
	fields: contactFields,
};

export const findContactActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', format: 'boolean' },
		{ key: 'data', label: 'Contact', children: contactFields },
	],
};

export const sendTransactionalEmailActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'messageId',
			label: 'Message ID',
			description: 'Angle bracketed SMTP message id, matching the message-id on email events.',
		},
	],
};

export const sendTransactionalSmsActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'messageId',
			label: 'Message ID',
			description:
				'Brevo accepts the SMS asynchronously, so a message id here does not confirm delivery.',
			format: 'number',
		},
	],
};

export const contactAddedToListTriggerOutputSchema: OutputSchema = {
	fields: [
		...marketingEventFields,
		{ key: 'list_id', label: 'List IDs', description: 'Lists the contact was added to.' },
	],
};

export const contactUpdatedTriggerOutputSchema: OutputSchema = {
	fields: [
		...marketingEventFields,
		{
			key: 'content',
			label: 'Changed Fields',
			labelKey: 'email',
			listItems: [
				{ key: 'email', label: 'Email', format: 'email' },
				{ key: 'attributes', label: 'Attributes', dynamicKey: true },
			],
		},
	],
};

export const contactDeletedTriggerOutputSchema: OutputSchema = {
	fields: [
		{ key: 'event', label: 'Event' },
		{
			key: 'email',
			label: 'Emails',
			description: 'Array of deleted addresses, unlike the single address other contact events send.',
		},
		{
			key: 'id',
			label: 'Webhook ID',
			description: 'The Brevo webhook that delivered this event, not the contact id.',
			format: 'number',
		},
		{ key: 'date', label: 'Date', format: 'datetime' },
		{ key: 'ts', label: 'Timestamp (seconds)', format: 'number' },
	],
};

export const contactUnsubscribedTriggerOutputSchema: OutputSchema = {
	fields: [
		...marketingEventFields,
		{ key: 'camp_id', label: 'Campaign ID', format: 'number' },
		{ key: 'campaign_name', label: 'Campaign Name' },
		{ key: 'list_id', label: 'List IDs' },
	],
};

export const emailDeliveredTriggerOutputSchema: OutputSchema = {
	fields: deliveryEventFields,
};

export const emailBouncedTriggerOutputSchema: OutputSchema = {
	fields: deliveryEventFields,
};

export const emailOpenedTriggerOutputSchema: OutputSchema = {
	fields: engagementEventFields,
};

export const emailClickedTriggerOutputSchema: OutputSchema = {
	fields: [
		...engagementEventFields,
		{ key: 'link', label: 'Clicked Link', format: 'url' },
	],
};

export const createContactActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'created', label: 'Created', format: 'boolean' },
		{ key: 'id', label: 'Contact ID', format: 'number' },
		{ key: 'email', label: 'Email', format: 'email' },
	],
};

export const updateContactActionOutputSchema: OutputSchema = {
	fields: identifierResultFields,
};

export const deleteContactActionOutputSchema: OutputSchema = {
	fields: identifierResultFields,
};

export const getContactActionOutputSchema: OutputSchema = findContactActionOutputSchema;

export const listContactsActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'contacts', label: 'Contacts', labelKey: 'email', listItems: contactSummaryFields },
		{
			key: 'count',
			label: 'Total Count',
			description: 'Total contacts matching the request, not just the ones on this page.',
			format: 'number',
		},
	],
};

export const importContactsActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'started', label: 'Started', format: 'boolean' },
		{
			key: 'processId',
			label: 'Process ID',
			description: 'Pass to Get Import Process to poll until the import finishes.',
			format: 'number',
		},
	],
};

export const getImportProcessActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Process ID', format: 'number' },
		{
			key: 'status',
			label: 'Status',
			description: 'queued, in_process, processing, completed, failed or cancelled.',
		},
		{
			key: 'finished',
			label: 'Finished',
			description: 'True once the status is completed, failed or cancelled.',
			format: 'boolean',
		},
		{ key: 'name', label: 'Process Name' },
		{
			key: 'export_url',
			label: 'Export URL',
			description: 'Download link, only on completed export processes.',
			format: 'url',
		},
		{
			key: 'info',
			label: 'Details',
			description: 'Only on completed imports.',
			children: [
				{
					key: 'import',
					label: 'Import Report',
					description: 'Links to CSV files of rejected rows, null when there were none.',
					children: [
						{ key: 'invalid_emails', label: 'Invalid Emails CSV', format: 'url' },
						{ key: 'duplicate_contact_id', label: 'Duplicate Contact IDs CSV', format: 'url' },
						{ key: 'duplicate_ext_id', label: 'Duplicate External IDs CSV', format: 'url' },
						{ key: 'duplicate_email_id', label: 'Duplicate Emails CSV', format: 'url' },
						{ key: 'duplicate_phone_id', label: 'Duplicate Phone Numbers CSV', format: 'url' },
						{ key: 'duplicate_whatsapp_id', label: 'Duplicate WhatsApp Numbers CSV', format: 'url' },
						{ key: 'duplicate_landline_number_id', label: 'Duplicate Landline Numbers CSV', format: 'url' },
					],
				},
			],
		},
	],
};

export const listContactAttributesActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'attributes', label: 'Attributes', labelKey: 'name', listItems: contactAttributeFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const createContactListActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'List ID', format: 'number' },
		{ key: 'name', label: 'Name' },
		{ key: 'folderId', label: 'Folder ID', format: 'number' },
	],
};

export const getContactListActionOutputSchema: OutputSchema = {
	fields: contactListDetailFields,
};

export const listContactListsActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'lists', label: 'Lists', labelKey: 'name', listItems: contactListSummaryFields },
		{
			key: 'count',
			label: 'Total Count',
			description: 'Total lists on the account, not just the ones on this page.',
			format: 'number',
		},
	],
};

export const unsubscribeContactActionOutputSchema: OutputSchema = {
	fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};
