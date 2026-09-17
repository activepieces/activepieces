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

const senderRefFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Sender ID' },
	{ key: 'email', label: 'Email', format: 'email' },
	{ key: 'name', label: 'Name' },
];

const emailTemplateFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Template ID', format: 'number' },
	{ key: 'name', label: 'Name' },
	{ key: 'subject', label: 'Subject' },
	{ key: 'isActive', label: 'Active', format: 'boolean' },
	{ key: 'sender', label: 'Sender', children: senderRefFields },
	{ key: 'replyTo', label: 'Reply To' },
	{ key: 'htmlContent', label: 'HTML Content', format: 'html' },
	{ key: 'tag', label: 'Tag' },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
	{ key: 'modifiedAt', label: 'Modified At', format: 'datetime' },
];

const campaignGlobalStatsFields: OutputSchema['fields'] = [
	{ key: 'sent', label: 'Sent', format: 'number' },
	{ key: 'delivered', label: 'Delivered', format: 'number' },
	{ key: 'viewed', label: 'Viewed', format: 'number' },
	{ key: 'uniqueViews', label: 'Unique Views', format: 'number' },
	{ key: 'clickers', label: 'Clickers', format: 'number' },
	{ key: 'uniqueClicks', label: 'Unique Clicks', format: 'number' },
	{ key: 'hardBounces', label: 'Hard Bounces', format: 'number' },
	{ key: 'softBounces', label: 'Soft Bounces', format: 'number' },
	{ key: 'unsubscriptions', label: 'Unsubscriptions', format: 'number' },
	{ key: 'complaints', label: 'Complaints', format: 'number' },
	{ key: 'opensRate', label: 'Opens Rate', format: 'number' },
];

const emailCampaignFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Campaign ID', format: 'number' },
	{ key: 'name', label: 'Name' },
	{ key: 'subject', label: 'Subject' },
	{ key: 'type', label: 'Type' },
	{ key: 'status', label: 'Status' },
	{ key: 'sender', label: 'Sender', children: senderRefFields },
	{ key: 'htmlContent', label: 'HTML Content', format: 'html' },
	{ key: 'scheduledAt', label: 'Scheduled At', format: 'datetime' },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
	{ key: 'modifiedAt', label: 'Modified At', format: 'datetime' },
	{
		key: 'recipients',
		label: 'Recipients',
		children: [
			{ key: 'lists', label: 'List IDs' },
			{ key: 'exclusionLists', label: 'Exclusion List IDs' },
		],
	},
	{
		key: 'statistics',
		label: 'Statistics',
		children: [{ key: 'globalStats', label: 'Global Stats', children: campaignGlobalStatsFields }],
	},
];

const smsCampaignFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Campaign ID', format: 'number' },
	{ key: 'name', label: 'Name' },
	{ key: 'status', label: 'Status' },
	{ key: 'content', label: 'Content' },
	{ key: 'sender', label: 'Sender' },
	{ key: 'scheduledAt', label: 'Scheduled At', format: 'datetime' },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
	{ key: 'modifiedAt', label: 'Modified At', format: 'datetime' },
	{
		key: 'recipients',
		label: 'Recipients',
		children: [
			{ key: 'lists', label: 'List IDs' },
			{ key: 'exclusionLists', label: 'Exclusion List IDs' },
		],
	},
	{
		key: 'statistics',
		label: 'Statistics',
		children: [
			{ key: 'sent', label: 'Sent', format: 'number' },
			{ key: 'delivered', label: 'Delivered', format: 'number' },
			{ key: 'softBounces', label: 'Soft Bounces', format: 'number' },
			{ key: 'hardBounces', label: 'Hard Bounces', format: 'number' },
			{ key: 'unsubscriptions', label: 'Unsubscriptions', format: 'number' },
			{ key: 'answered', label: 'Answered', format: 'number' },
		],
	},
];

const companyFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Company ID' },
	{ key: 'attributes', label: 'Attributes', dynamicKey: true },
	{ key: 'linkedContactsIds', label: 'Linked Contact IDs' },
	{ key: 'linkedDealsIds', label: 'Linked Deal IDs' },
];

export const listContactsActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'contacts', label: 'Contacts', listItems: contactFields, labelKey: 'email' },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const updateContactActionOutputSchema: OutputSchema = {
	fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};

export const importContactsActionOutputSchema: OutputSchema = {
	fields: [{ key: 'processId', label: 'Process ID', format: 'number' }],
};

export const listContactAttributesActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'attributes',
			label: 'Attributes',
			listItems: [
				{ key: 'name', label: 'Name' },
				{ key: 'category', label: 'Category' },
				{ key: 'type', label: 'Type' },
			],
			labelKey: 'name',
		},
	],
};

export const getContactCampaignStatsActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'opened', label: 'Opened' },
		{ key: 'clicked', label: 'Clicked' },
		{ key: 'delivered', label: 'Delivered' },
		{ key: 'complaints', label: 'Complaints' },
		{ key: 'hardBounces', label: 'Hard Bounces' },
		{ key: 'softBounces', label: 'Soft Bounces' },
		{ key: 'messagesSent', label: 'Messages Sent' },
		{ key: 'unsubscriptions', label: 'Unsubscriptions' },
		{ key: 'transacAttributes', label: 'Transactional Attributes' },
	],
};

export const createContactListActionOutputSchema: OutputSchema = {
	fields: [{ key: 'id', label: 'List ID', format: 'number' }],
};

export const listContactListsActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'lists',
			label: 'Lists',
			listItems: [
				{ key: 'id', label: 'List ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'folderId', label: 'Folder ID', format: 'number' },
				{ key: 'uniqueSubscribers', label: 'Unique Subscribers', format: 'number' },
				{ key: 'totalSubscribers', label: 'Total Subscribers', format: 'number' },
				{ key: 'totalBlacklisted', label: 'Total Blacklisted', format: 'number' },
			],
			labelKey: 'name',
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const getContactListActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', format: 'boolean' },
		{
			key: 'data',
			label: 'List',
			children: [
				{ key: 'id', label: 'List ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'folderId', label: 'Folder ID', format: 'number' },
				{ key: 'totalSubscribers', label: 'Total Subscribers', format: 'number' },
				{ key: 'uniqueSubscribers', label: 'Unique Subscribers', format: 'number' },
				{ key: 'totalBlacklisted', label: 'Total Blacklisted', format: 'number' },
				{ key: 'createdAt', label: 'Created At', format: 'datetime' },
				{ key: 'dynamicList', label: 'Dynamic List', format: 'boolean' },
			],
		},
	],
};

export const createCompanyActionOutputSchema: OutputSchema = {
	fields: [{ key: 'id', label: 'Company ID' }],
};

export const getCompanyActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', format: 'boolean' },
		{ key: 'data', label: 'Company', children: companyFields },
	],
};

export const listCompaniesActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'items', label: 'Companies', listItems: companyFields, labelKey: 'id' },
		{
			key: 'pager',
			label: 'Pager',
			children: [
				{ key: 'current', label: 'Current Page', format: 'number' },
				{ key: 'limit', label: 'Limit', format: 'number' },
				{ key: 'count', label: 'Count', format: 'number' },
				{ key: 'total', label: 'Total', format: 'number' },
			],
		},
	],
};

export const listCrmNotesActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'notes',
			value: '',
			label: 'Notes',
			listItems: [
				{ key: 'id', label: 'Note ID' },
				{ key: 'text', label: 'Text' },
				{ key: 'contactIds', label: 'Contact IDs' },
				{ key: 'companyIds', label: 'Company IDs' },
				{ key: 'dealIds', label: 'Deal IDs' },
				{ key: 'createdAt', label: 'Created At', format: 'datetime' },
				{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
			],
		},
	],
	itemLabel: '{text}',
};

export const listSendersActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'senders',
			label: 'Senders',
			listItems: [
				{ key: 'id', label: 'Sender ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'email', label: 'Email', format: 'email' },
				{ key: 'active', label: 'Active', format: 'boolean' },
			],
			labelKey: 'email',
		},
	],
};

export const listSenderDomainsActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'domains',
			label: 'Domains',
			listItems: [
				{ key: 'id', label: 'Domain ID' },
				{ key: 'domain_name', label: 'Domain Name' },
				{ key: 'authenticated', label: 'Authenticated', format: 'boolean' },
				{ key: 'verified', label: 'Verified', format: 'boolean' },
			],
			labelKey: 'domain_name',
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const createOrUpdateEmailTemplateActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Template ID', format: 'number' },
		{ key: 'success', label: 'Success', format: 'boolean' },
	],
};

export const getEmailTemplateActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', format: 'boolean' },
		{ key: 'data', label: 'Template', children: emailTemplateFields },
	],
};

export const listEmailTemplatesActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'templates', label: 'Templates', listItems: emailTemplateFields, labelKey: 'name' },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const createEmailCampaignActionOutputSchema: OutputSchema = {
	fields: [{ key: 'id', label: 'Campaign ID', format: 'number' }],
};

export const updateEmailCampaignActionOutputSchema: OutputSchema = {
	fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};

export const getEmailCampaignActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', format: 'boolean' },
		{ key: 'data', label: 'Campaign', children: emailCampaignFields },
	],
};

export const listEmailCampaignsActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'campaigns', label: 'Campaigns', listItems: emailCampaignFields, labelKey: 'name' },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const createSmsCampaignActionOutputSchema: OutputSchema = {
	fields: [{ key: 'id', label: 'Campaign ID', format: 'number' }],
};

export const getSmsCampaignActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', format: 'boolean' },
		{ key: 'data', label: 'SMS Campaign', children: smsCampaignFields },
	],
};

export const listSmsCampaignsActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'campaigns', label: 'SMS Campaigns', listItems: smsCampaignFields, labelKey: 'name' },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const listTransactionalEmailEventsActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'events',
			label: 'Events',
			listItems: [
				{ key: 'email', label: 'Recipient', format: 'email' },
				{ key: 'event', label: 'Event Type' },
				{ key: 'date', label: 'Date', format: 'datetime' },
				{ key: 'subject', label: 'Subject' },
				{ key: 'messageId', label: 'Message ID' },
				{ key: 'from', label: 'From', format: 'email' },
				{ key: 'ip', label: 'IP' },
				{ key: 'reason', label: 'Reason' },
				{ key: 'link', label: 'Clicked Link', format: 'url' },
				{ key: 'templateId', label: 'Template ID', format: 'number' },
			],
			labelKey: 'email',
		},
	],
};

export const getAccountInfoActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'email', label: 'Email', format: 'email' },
		{ key: 'firstName', label: 'First Name' },
		{ key: 'lastName', label: 'Last Name' },
		{ key: 'companyName', label: 'Company Name' },
		{
			key: 'address',
			label: 'Address',
			children: [
				{ key: 'street', label: 'Street' },
				{ key: 'city', label: 'City' },
				{ key: 'zipCode', label: 'Zip Code' },
				{ key: 'country', label: 'Country' },
			],
		},
		{
			key: 'plan',
			label: 'Plan',
			listItems: [
				{ key: 'type', label: 'Type' },
				{ key: 'credits', label: 'Credits', format: 'number' },
				{ key: 'creditsType', label: 'Credits Type' },
				{ key: 'startDate', label: 'Start Date' },
				{ key: 'endDate', label: 'End Date' },
			],
			labelKey: 'type',
		},
		{
			key: 'relay',
			label: 'Relay',
			children: [{ key: 'enabled', label: 'Relay Enabled', format: 'boolean' }],
		},
		{ key: 'language', label: 'Language' },
	],
};
