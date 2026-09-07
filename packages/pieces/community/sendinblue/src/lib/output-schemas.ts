import { OutputSchema } from '@activepieces/pieces-framework';

const contactFields: OutputSchema['fields'] = [
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
