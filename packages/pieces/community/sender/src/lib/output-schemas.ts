import { OutputSchema } from '@activepieces/pieces-framework';

const pageLinksField: OutputSchema['fields'][number] = {
	key: 'links',
	label: 'Page Links',
	children: [
		{ key: 'first', label: 'First Page URL', format: 'url' },
		{ key: 'last', label: 'Last Page URL', format: 'url' },
		{ key: 'prev', label: 'Previous Page URL', format: 'url' },
		{ key: 'next', label: 'Next Page URL', format: 'url' },
	],
};

const pageMetaField: OutputSchema['fields'][number] = {
	key: 'meta',
	label: 'Pagination',
	children: [
		{ key: 'current_page', label: 'Current Page', format: 'number' },
		{ key: 'last_page', label: 'Last Page', format: 'number' },
		{ key: 'per_page', label: 'Per Page', format: 'number' },
		{ key: 'from', label: 'From Item', format: 'number' },
		{ key: 'to', label: 'To Item', format: 'number' },
		{ key: 'total', label: 'Total', format: 'number' },
	],
};

const hasMoreField: OutputSchema['fields'][number] = {
	key: 'has_more_resources',
	label: 'Has More Pages',
	format: 'boolean',
};

const subscriberStatusField: OutputSchema['fields'][number] = {
	key: 'status',
	label: 'Status',
	children: [
		{ key: 'email', label: 'Email Status' },
		{ key: 'temail', label: 'Transactional Email Status' },
		{ key: 'sms', label: 'SMS Status' },
		{ key: 'tsms', label: 'Transactional SMS Status' },
	],
};

const subscriberGroupsField: OutputSchema['fields'][number] = {
	key: 'subscriber_tags',
	label: 'Groups',
	labelKey: 'title',
	listItems: [
		{ key: 'id', label: 'Group ID' },
		{ key: 'title', label: 'Group Title' },
	],
};

const subscriberFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Subscriber ID' },
	{ key: 'email', label: 'Email', format: 'email' },
	{ key: 'firstname', label: 'First Name' },
	{ key: 'lastname', label: 'Last Name' },
	{ key: 'phone', label: 'Phone' },
	{
		key: 'phone_country',
		label: 'Phone Country',
		children: [
			{ key: 'country_code', label: 'Country Code' },
			{ key: 'phone_code', label: 'Phone Code', format: 'number' },
		],
	},
	subscriberStatusField,
	subscriberGroupsField,
	{
		key: 'columns',
		label: 'Fields',
		labelKey: 'title',
		listItems: [
			{ key: 'id', label: 'Field ID' },
			{ key: 'title', label: 'Field Title' },
			{ key: 'type', label: 'Field Type' },
			{ key: 'value', label: 'Value' },
		],
	},
	{ key: 'source', label: 'Source' },
	{ key: 'ip_address', label: 'IP Address' },
	{ key: 'location', label: 'Location' },
	{ key: 'created', label: 'Created', format: 'datetime' },
	{ key: 'created_utc', label: 'Created (UTC)', format: 'datetime' },
	{ key: 'bounced_at', label: 'Bounced At', format: 'datetime' },
	{ key: 'bounced_at_utc', label: 'Bounced At (UTC)', format: 'datetime' },
	{ key: 'unsubscribed_at', label: 'Unsubscribed At', format: 'datetime' },
	{ key: 'unsubscribed_at_utc', label: 'Unsubscribed At (UTC)', format: 'datetime' },
];

const memberFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Subscriber ID' },
	{ key: 'email', label: 'Email', format: 'email' },
	{ key: 'firstname', label: 'First Name' },
	{ key: 'lastname', label: 'Last Name' },
	{ key: 'phone', label: 'Phone' },
	{
		key: 'phone_country',
		label: 'Phone Country',
		children: [
			{ key: 'code', label: 'Country Code' },
			{ key: 'name', label: 'Country' },
			{ key: 'phone_code', label: 'Phone Code', format: 'number' },
		],
	},
	subscriberStatusField,
	subscriberGroupsField,
	{
		key: 'columns',
		label: 'Fields',
		labelKey: 'title',
		listItems: [
			{ key: 'id', label: 'Field ID' },
			{ key: 'title', label: 'Field Title' },
			{ key: 'type', label: 'Field Type' },
			{ key: 'default', label: 'Default Field', format: 'boolean' },
			{ key: 'value', label: 'Value' },
		],
	},
	{ key: 'source', label: 'Source' },
	{ key: 'ip_address', label: 'IP Address' },
	{ key: 'location', label: 'Location' },
	{ key: 'created', label: 'Created', format: 'datetime' },
	{ key: 'bounced_at', label: 'Bounced At', format: 'datetime' },
	{ key: 'unsubscribed_at', label: 'Unsubscribed At', format: 'datetime' },
];

const webhookSubscriberFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Subscriber ID' },
	{ key: 'email', label: 'Email', format: 'email' },
	{ key: 'firstname', label: 'First Name' },
	{ key: 'lastname', label: 'Last Name' },
	{ key: 'phone', label: 'Phone' },
	{ key: 'phone_country', label: 'Phone Country' },
	{
		key: 'status',
		label: 'Status',
		children: [
			{ key: 'email', label: 'Email Status' },
			{ key: 'temail', label: 'Transactional Email Status' },
		],
	},
	subscriberGroupsField,
	{
		key: 'columns',
		label: 'Fields',
		labelKey: 'title',
		listItems: [
			{ key: 'id', label: 'Field ID' },
			{ key: 'title', label: 'Field Title' },
			{ key: 'type', label: 'Field Type' },
			{ key: 'default', label: 'Default Field', format: 'boolean' },
			{ key: 'value', label: 'Value' },
		],
	},
	{ key: 'source', label: 'Source' },
	{ key: 'ip_address', label: 'IP Address' },
	{ key: 'location', label: 'Location' },
	{ key: 'created', label: 'Created', format: 'datetime' },
	{ key: 'bounced_at', label: 'Bounced At', format: 'datetime' },
	{ key: 'unsubscribed_at', label: 'Unsubscribed At', format: 'datetime' },
];

const groupFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Group ID' },
	{ key: 'title', label: 'Title' },
	{ key: 'recipient_count', label: 'Recipient Count', format: 'number' },
	{ key: 'active_subscribers', label: 'Active Subscribers', format: 'number' },
	{ key: 'unsubscribed_count', label: 'Unsubscribed Count', format: 'number' },
	{ key: 'bounced_count', label: 'Bounced Count', format: 'number' },
	{ key: 'phone_count', label: 'Phone Count', format: 'number' },
	{ key: 'active_phone_count', label: 'Active Phone Count', format: 'number' },
	{ key: 'is_recalculating_subscribers', label: 'Recalculating Subscribers', format: 'boolean' },
	{ key: 'is_favourite', label: 'Favourite', format: 'boolean' },
	{ key: 'used_in_integration', label: 'Used in Integration', format: 'boolean' },
	{ key: 'account_id', label: 'Account ID' },
	{ key: 'user_id', label: 'User ID' },
	{ key: 'created', label: 'Created', format: 'datetime' },
	{ key: 'modified', label: 'Modified', format: 'datetime' },
];

const fieldFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Field ID' },
	{ key: 'title', label: 'Title' },
	{
		key: 'name',
		label: 'Name',
		description: 'Merge name like {{company}}; write values with the key {$company}.',
	},
	{ key: 'type', label: 'Type' },
	{ key: 'show', label: 'Shown in Dashboard', format: 'boolean' },
	{ key: 'default', label: 'Default Field', format: 'boolean' },
	{ key: 'default_value', label: 'Default Value' },
	{ key: 'position', label: 'Position', format: 'number' },
	{ key: 'options', label: 'Options' },
	{ key: 'account_id', label: 'Account ID' },
	{ key: 'user_id', label: 'User ID' },
	{ key: 'created', label: 'Created', format: 'datetime' },
	{ key: 'modified', label: 'Modified', format: 'datetime' },
];

const segmentFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Segment ID' },
	{ key: 'name', label: 'Name' },
	{
		key: 'conditions',
		label: 'Conditions',
		children: [
			{ key: 'match', label: 'Match' },
			{
				key: 'condition_sets',
				label: 'Condition Sets',
				listItems: [
					{ key: 'match', label: 'Match' },
					{
						key: 'conditions',
						label: 'Conditions',
						listItems: [
							{ key: 'type', label: 'Type' },
							{ key: 'operator', label: 'Operator' },
							{ key: 'value', label: 'Value' },
						],
					},
				],
			},
		],
	},
	{ key: 'recipient_count', label: 'Recipient Count', format: 'number' },
	{ key: 'active_subscribers', label: 'Active Subscribers', format: 'number' },
	{ key: 'unsubscribed_count', label: 'Unsubscribed Count', format: 'number' },
	{ key: 'bounced_count', label: 'Bounced Count', format: 'number' },
	{ key: 'phone_count', label: 'Phone Count', format: 'number' },
	{ key: 'active_phone_count', label: 'Active Phone Count', format: 'number' },
	{ key: 'subscribers', label: 'Subscribers' },
	{ key: 'counter_calculated_at', label: 'Counts Calculated At', format: 'datetime' },
	{ key: 'is_recalculating_subscribers', label: 'Recalculating Subscribers', format: 'boolean' },
	{ key: 'is_favourite', label: 'Favourite', format: 'boolean' },
	{ key: 'account_id', label: 'Account ID' },
	{ key: 'created', label: 'Created', format: 'datetime' },
	{ key: 'modified', label: 'Modified', format: 'datetime' },
];

const campaignHtmlField: OutputSchema['fields'][number] = {
	key: 'html',
	label: 'Content',
	children: [
		{ key: 'id', label: 'Content ID' },
		{ key: 'html_content', label: 'HTML', format: 'html' },
		{ key: 'html_body', label: 'HTML Body', format: 'html' },
		{ key: 'thumbnail_url', label: 'Thumbnail', format: 'image' },
		{ key: 'has_preview', label: 'Has Preview', format: 'boolean' },
		{ key: 'has_snapshots', label: 'Has Snapshots', format: 'boolean' },
		{ key: 'version', label: 'Version', format: 'number' },
	],
};

const campaignFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Campaign ID' },
	{ key: 'title', label: 'Title' },
	{ key: 'subject', label: 'Subject' },
	{ key: 'from', label: 'From Name' },
	{ key: 'reply_to', label: 'Reply To', format: 'email' },
	{ key: 'preheader', label: 'Preheader' },
	{ key: 'status', label: 'Status' },
	{ key: 'editor', label: 'Editor' },
	{ key: 'language', label: 'Language' },
	{ key: 'last_action', label: 'Last Action' },
	{ key: 'schedule_time', label: 'Scheduled For', format: 'datetime' },
	{ key: 'sent_time', label: 'Sent At', format: 'datetime' },
	{ key: 'recipient_count', label: 'Recipient Count', format: 'number' },
	{ key: 'sent_count', label: 'Sent Count', format: 'number' },
	{ key: 'opens', label: 'Opens', format: 'number' },
	{ key: 'clicks', label: 'Clicks', format: 'number' },
	{ key: 'bounces_count', label: 'Bounces', format: 'number' },
	{
		key: 'reports',
		label: 'Rates',
		children: [
			{ key: 'spam_percentage', label: 'Spam %', format: 'number' },
			{ key: 'hard_bounce_percentage', label: 'Hard Bounce %', format: 'number' },
			{ key: 'unsubscribe_percentage', label: 'Unsubscribe %', format: 'number' },
		],
	},
	{ key: 'campaign_groups', label: 'Group IDs' },
	{ key: 'segments', label: 'Segment IDs' },
	{ key: 'send_to_all', label: 'Send to All', format: 'number' },
	{ key: 'auto_followup_active', label: 'Auto Follow-up Active' },
	{ key: 'auto_followup_subject', label: 'Auto Follow-up Subject' },
	{ key: 'auto_followup_delay', label: 'Auto Follow-up Delay (hours)' },
	{ key: 'ecommerce_tracking_enabled', label: 'Ecommerce Tracking' },
	{ key: 'experiment_id', label: 'Experiment ID' },
	{ key: 'domain_id', label: 'Domain ID' },
	campaignHtmlField,
	{ key: 'created', label: 'Created', format: 'datetime' },
	{ key: 'modified', label: 'Modified', format: 'datetime' },
];

const transactionalCampaignFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Transactional Campaign ID' },
	{ key: 'title', label: 'Title' },
	{ key: 'subject', label: 'Subject' },
	{ key: 'from', label: 'From Name' },
	{ key: 'reply_to', label: 'Reply To', format: 'email' },
	{ key: 'preheader', label: 'Preheader' },
	{ key: 'type', label: 'Type' },
	{ key: 'editor', label: 'Editor' },
	{ key: 'last_action', label: 'Last Action' },
	{ key: 'disable_click_tracking', label: 'Click Tracking Disabled', format: 'boolean' },
	{
		key: 'html',
		label: 'Content',
		children: [
			{ key: 'id', label: 'Content ID' },
			{ key: 'thumbnail_url', label: 'Thumbnail', format: 'image' },
			{ key: 'has_preview', label: 'Has Preview', format: 'boolean' },
			{ key: 'has_snapshots', label: 'Has Snapshots', format: 'boolean' },
			{ key: 'styles', label: 'Styles' },
		],
	},
	{ key: 'domain_id', label: 'Domain ID' },
	{ key: 'account_id', label: 'Account ID' },
	{ key: 'user_id', label: 'User ID' },
	{ key: 'created', label: 'Created', format: 'datetime' },
	{ key: 'modified', label: 'Modified', format: 'datetime' },
];

const transactionalStatsFields: OutputSchema['fields'] = [
	{ key: 'sent', label: 'Sent', format: 'number' },
	{ key: 'opens', label: 'Opens', format: 'number' },
	{ key: 'clicks', label: 'Clicks', format: 'number' },
	{ key: 'bounced', label: 'Bounced', format: 'number' },
	{ key: 'unsubscribeCount', label: 'Unsubscribes', format: 'number' },
];

const channelStatusField: OutputSchema['fields'][number] = {
	key: 'channel_status',
	label: 'Status Changes',
	labelKey: 'type',
	listItems: [
		{ key: 'type', label: 'Change' },
		{ key: 'source', label: 'Source' },
		{ key: 'user', label: 'Changed By', format: 'email' },
		{ key: 'created_at', label: 'Changed At', format: 'datetime' },
	],
};

const removeResultField: OutputSchema['fields'][number] = {
	key: 'message',
	label: 'Result',
	children: [
		{ key: 'subscribers_remove_tag_group', label: 'Removed' },
		{ key: 'subscribers_without_group_already', label: 'Not in Group' },
		{ key: 'non_existing_subscribers', label: 'Not Found' },
		{ key: 'invalid_emails', label: 'Invalid Emails' },
	],
};

export const senderSuccessOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'message', label: 'Message' },
	],
};

export const senderSubscriberWriteOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'message', label: 'Message', children: [{ key: 'text', label: 'Text' }] },
		{ key: 'data', label: 'Subscriber', children: subscriberFields },
	],
};

export const senderSubscriberUpsertOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{
			key: 'message',
			label: 'Message',
			children: [
				{ key: 'text', label: 'Text' },
				{
					key: 'warnings',
					label: 'Warnings',
					dynamicKey: true,
					description: 'Per-field warnings, e.g. a custom field key that does not exist.',
				},
			],
		},
		{ key: 'data', label: 'Subscriber', children: subscriberFields },
	],
};

export const senderGetSubscriberOutputSchema: OutputSchema = {
	fields: subscriberFields,
};

export const senderListSubscribersOutputSchema: OutputSchema = {
	fields: [
		{ key: 'data', label: 'Subscribers', labelKey: 'email', listItems: subscriberFields },
		pageMetaField,
	],
};

export const senderDeleteSubscribersOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'message', label: 'Message' },
		{ key: 'delete_instance', label: 'Delete Job' },
	],
};

export const senderAddSubscribersToGroupOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{
			key: 'message',
			label: 'Result',
			children: [
				{ key: 'subscribers_add_tag_group', label: 'Added' },
				{ key: 'subscribers_with_group_already', label: 'Already in Group' },
				{ key: 'non_existing_subscribers', label: 'Not Found' },
				{ key: 'invalid_emails', label: 'Invalid Emails' },
			],
		},
	],
};

export const senderRemoveSubscribersFromGroupOutputSchema: OutputSchema = {
	fields: [{ key: 'success', label: 'Success', format: 'boolean' }, removeResultField],
};

export const senderRemoveSubscriberFromGroupOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'subscribers', label: 'Subscribers' },
		{ key: 'groupId', label: 'Group ID' },
		{ key: 'removedAt', label: 'Removed At', format: 'datetime' },
		{
			key: 'response',
			label: 'Response',
			children: [{ key: 'success', label: 'Success', format: 'boolean' }, removeResultField],
		},
	],
};

export const senderListSubscriberEventsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'email',
			label: 'Email Campaigns',
			children: [
				{ key: 'got', label: 'Received' },
				{ key: 'opened', label: 'Opened' },
				{ key: 'clicked', label: 'Clicked' },
				{ key: 'bounced', label: 'Bounced' },
				{ key: 'unsubscribed', label: 'Unsubscribed' },
				channelStatusField,
			],
		},
		{
			key: 'temail',
			label: 'Transactional Email',
			children: [
				{ key: 'got', label: 'Received' },
				{ key: 'opened', label: 'Opened' },
				{ key: 'clicked', label: 'Clicked' },
				{ key: 'bounced', label: 'Bounced' },
				{ key: 'unsubscribed', label: 'Unsubscribed' },
				channelStatusField,
			],
		},
		{
			key: 'sms',
			label: 'SMS',
			children: [
				{ key: 'clicked', label: 'Clicked' },
				{ key: 'unsubscribed', label: 'Unsubscribed' },
				channelStatusField,
			],
		},
		{
			key: 'tsms',
			label: 'Transactional SMS',
			children: [
				{ key: 'clicked', label: 'Clicked' },
				{ key: 'unsubscribed', label: 'Unsubscribed' },
				channelStatusField,
			],
		},
		{
			key: 'email_campaign',
			label: 'Email Totals',
			children: [
				{ key: 'sent_count', label: 'Sent', format: 'number' },
				{ key: 'opened_count', label: 'Opened', format: 'number' },
				{ key: 'clicked_count', label: 'Clicked', format: 'number' },
				{ key: 'bounced', label: 'Bounced', format: 'number' },
				{ key: 'spam_reported', label: 'Spam Reported', format: 'number' },
				{ key: 'unsubscribed', label: 'Unsubscribed', format: 'number' },
				{ key: 'unsubscribed_at', label: 'Unsubscribed At', format: 'datetime' },
			],
		},
		{
			key: 'sms_campaign',
			label: 'SMS Totals',
			children: [
				{ key: 'sent_count', label: 'Sent', format: 'number' },
				{ key: 'delivered_count', label: 'Delivered', format: 'number' },
				{ key: 'failed_count', label: 'Failed', format: 'number' },
				{ key: 'clicked_count', label: 'Clicked', format: 'number' },
				{ key: 'unsubscribed', label: 'Unsubscribed', format: 'number' },
				{ key: 'unsubscribed_at', label: 'Unsubscribed At', format: 'datetime' },
			],
		},
		{ key: 'custom_events', label: 'Custom Events' },
		{ key: 'store', label: 'Store Activity' },
		{ key: 'site_visits', label: 'Site Visits' },
		{ key: 'subscriber_changes', label: 'Profile Changes' },
	],
};

export const senderSubscriberTriggerOutputSchema: OutputSchema = {
	fields: webhookSubscriberFields,
};

export const senderGroupWriteOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'message', label: 'Message' },
		{ key: 'data', label: 'Group', children: groupFields },
	],
};

export const senderGetGroupOutputSchema: OutputSchema = {
	fields: groupFields,
};

export const senderListGroupsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'data', label: 'Groups', labelKey: 'title', listItems: groupFields },
		pageLinksField,
		pageMetaField,
	],
};

export const senderListMembersOutputSchema: OutputSchema = {
	fields: [
		{ key: 'data', label: 'Subscribers', labelKey: 'email', listItems: memberFields },
		pageLinksField,
		pageMetaField,
	],
};

export const senderFieldWriteOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'message', label: 'Message' },
		{ key: 'data', label: 'Field', children: fieldFields },
	],
};

export const senderListFieldsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'data', label: 'Fields', labelKey: 'title', listItems: fieldFields },
		pageLinksField,
		pageMetaField,
	],
};

export const senderGetSegmentOutputSchema: OutputSchema = {
	fields: segmentFields,
};

export const senderListSegmentsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'data', label: 'Segments', labelKey: 'name', listItems: segmentFields },
		pageLinksField,
		pageMetaField,
	],
};

export const senderCampaignWriteOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'message', label: 'Message' },
		{ key: 'data', label: 'Campaign', children: campaignFields },
	],
};

export const senderGetCampaignOutputSchema: OutputSchema = {
	fields: campaignFields,
};

export const senderListCampaignsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'data', label: 'Campaigns', labelKey: 'title', listItems: campaignFields },
		pageLinksField,
		pageMetaField,
		hasMoreField,
	],
};

export const senderListCampaignErrorsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'errors',
			label: 'Errors',
			labelKey: 'title',
			listItems: [
				{ key: 'title', label: 'Title' },
				{ key: 'details', label: 'Details' },
				{ key: 'route', label: 'Where to Fix' },
			],
		},
		{ key: 'warnings', label: 'Warnings' },
	],
};

export const senderReportPageOutputSchema: OutputSchema = {
	fields: [{ key: 'data', label: 'Records' }, pageLinksField, pageMetaField],
};

export const senderTransactionalCampaignWriteOutputSchema: OutputSchema = {
	fields: [{ key: 'data', label: 'Transactional Campaign', children: transactionalCampaignFields }],
};

export const senderGetTransactionalCampaignOutputSchema: OutputSchema = {
	fields: [...transactionalCampaignFields, ...transactionalStatsFields],
};

export const senderListTransactionalCampaignsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'data',
			label: 'Transactional Campaigns',
			labelKey: 'title',
			listItems: [...transactionalCampaignFields, ...transactionalStatsFields],
		},
		pageLinksField,
		pageMetaField,
		hasMoreField,
	],
};

export const senderGetTransactionalCampaignReportOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'totals',
			label: 'Totals',
			children: [
				{ key: 'sent_total', label: 'Sent', format: 'number' },
				{ key: 'opens_total', label: 'Opens', format: 'number' },
				{ key: 'clicks_total', label: 'Clicks', format: 'number' },
				{ key: 'bounces_total', label: 'Bounces', format: 'number' },
				{ key: 'soft_bounces_total', label: 'Soft Bounces', format: 'number' },
				{ key: 'hard_bounces_total', label: 'Hard Bounces', format: 'number' },
				{ key: 'unsubscribes_total', label: 'Unsubscribes', format: 'number' },
				{ key: 'complaints_total', label: 'Complaints', format: 'number' },
			],
		},
		{ key: 'sent', label: 'Sent per Period' },
		{ key: 'opens', label: 'Opens per Period' },
		{ key: 'clicks', label: 'Clicks per Period' },
		{ key: 'bounces', label: 'Bounces per Period' },
		{ key: 'soft_bounces', label: 'Soft Bounces per Period' },
		{ key: 'hard_bounces', label: 'Hard Bounces per Period' },
		{ key: 'unsubscribes', label: 'Unsubscribes per Period' },
		{ key: 'complaints', label: 'Complaints per Period' },
	],
};

export const senderGetWorkflowOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Workflow ID' },
		{ key: 'title', label: 'Title' },
		{ key: 'description', label: 'Description' },
		{ key: 'status', label: 'Status' },
		{ key: 'type', label: 'Type' },
		{ key: 'emails_sent', label: 'Emails Sent', format: 'number' },
		{
			key: 'report',
			label: 'Report',
			children: [
				{ key: 'sent_count', label: 'Sent', format: 'number' },
				{ key: 'finished_recipient_count', label: 'Finished Recipients', format: 'number' },
			],
		},
		{ key: 'index_report', label: 'Summary' },
		{ key: 'thumbnail', label: 'Thumbnail', format: 'image' },
		{ key: 'workflow_category_id', label: 'Category ID' },
		{ key: 'account_id', label: 'Account ID' },
		{ key: 'user_id', label: 'User ID' },
		{ key: 'created', label: 'Created', format: 'datetime' },
		{ key: 'modified', label: 'Modified', format: 'datetime' },
	],
};

export const senderListWorkflowsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'data',
			label: 'Workflows',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'Workflow ID' },
				{ key: 'title', label: 'Title' },
				{ key: 'description', label: 'Description' },
				{ key: 'status', label: 'Status' },
				{ key: 'type', label: 'Type' },
				{ key: 'emails_sent', label: 'Emails Sent', format: 'number' },
				{
					key: 'index_report',
					label: 'Summary',
					children: [
						{ key: 'emails_sent', label: 'Emails Sent', format: 'number' },
						{ key: 'opens', label: 'Opens', format: 'number' },
						{ key: 'clicks', label: 'Clicks', format: 'number' },
					],
				},
				{ key: 'report', label: 'Report' },
				{ key: 'thumbnail', label: 'Thumbnail', format: 'image' },
				{ key: 'workflow_category_id', label: 'Category ID' },
				{ key: 'account_id', label: 'Account ID' },
				{ key: 'user_id', label: 'User ID' },
				{ key: 'created', label: 'Created', format: 'datetime' },
				{ key: 'modified', label: 'Modified', format: 'datetime' },
			],
		},
		pageLinksField,
		pageMetaField,
		hasMoreField,
	],
};

export const senderGetWorkflowStatisticsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'subscribers_in_workflow', label: 'Subscribers in Workflow', format: 'number' },
		{ key: 'completed_count', label: 'Completed', format: 'number' },
		{ key: 'total_emails_sent', label: 'Emails Sent', format: 'number' },
		{ key: 'average_open_rate', label: 'Average Open Rate', format: 'number' },
		{ key: 'average_click_rate', label: 'Average Click Rate', format: 'number' },
		{ key: 'average_unsub_rate', label: 'Average Unsubscribe Rate', format: 'number' },
		{ key: 'average_bounce_rate', label: 'Average Bounce Rate', format: 'number' },
		{ key: 'average_complaints_rate', label: 'Average Complaint Rate', format: 'number' },
	],
};

export const senderListWorkflowStepsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'data',
			label: 'Steps',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'Step ID' },
				{ key: 'parent_id', label: 'Parent Step ID' },
				{ key: 'workflow_id', label: 'Workflow ID' },
				{ key: 'title', label: 'Title' },
				{ key: 'type', label: 'Type' },
				{ key: 'trigger_type', label: 'Trigger Type' },
				{ key: 'trigger_time', label: 'Trigger Time' },
				{
					key: 'trigger_definition',
					label: 'Trigger',
					children: [
						{ key: 'triggerType', label: 'Trigger Type' },
						{ key: 'listId', label: 'Group ID' },
						{ key: 'listTitle', label: 'Group Title' },
					],
				},
				{ key: 'delay_amount', label: 'Delay Amount', format: 'number' },
				{ key: 'delay_type', label: 'Delay Unit' },
				{ key: 'delay_definition', label: 'Delay' },
				{ key: 'condition_definition', label: 'Condition' },
				{ key: 'condition_path', label: 'Condition Path' },
				{ key: 'action_definition', label: 'Action' },
				{ key: 'transactional_campaign_id', label: 'Email ID' },
				{
					key: 'transactional_campaign',
					label: 'Email',
					children: [
						{ key: 'id', label: 'Email ID' },
						{ key: 'title', label: 'Title' },
						{ key: 'subject', label: 'Subject' },
						{ key: 'from', label: 'From Name' },
						{ key: 'reply_to', label: 'Reply To', format: 'email' },
						{ key: 'preheader', label: 'Preheader' },
						{ key: 'editor', label: 'Editor' },
						{ key: 'type', label: 'Type' },
						{ key: 'language', label: 'Language' },
						{ key: 'used_variables', label: 'Used Variables' },
					],
				},
				{ key: 'sms_campaign_id', label: 'SMS ID' },
				{ key: 'sms_campaign', label: 'SMS' },
				{ key: 'emails_sent', label: 'Emails Sent', format: 'number' },
				{ key: 'active_subscribers_count', label: 'Active Subscribers', format: 'number' },
				{ key: 'complete', label: 'Complete', format: 'number' },
				{ key: 'thumbnail_url', label: 'Thumbnail', format: 'image' },
				{ key: 'created_at_utc', label: 'Created (UTC)', format: 'datetime' },
				{ key: 'updated_at_utc', label: 'Updated (UTC)', format: 'datetime' },
			],
		},
	],
};
