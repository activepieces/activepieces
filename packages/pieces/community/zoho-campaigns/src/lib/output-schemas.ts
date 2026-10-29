import { OutputSchema } from '@activepieces/pieces-framework';

const responseFields: OutputSchema['fields'] = [
	{ key: 'status', label: 'Status' },
	{ key: 'code', label: 'Code' },
	{ key: 'uri', label: 'URI' },
	{ key: 'version', label: 'API Version' },
];

const statusFields: OutputSchema['fields'] = [
	...responseFields,
	{ key: 'message', label: 'Message' },
];

const campaignSummaryFields: OutputSchema['fields'] = [
	{ key: 'campaign_key', label: 'Campaign Key' },
	{ key: 'campaignId', label: 'Campaign ID' },
	{ key: 'campaign_name', label: 'Campaign Name' },
	{ key: 'subject', label: 'Subject' },
	{ key: 'campaign_status', label: 'Campaign Status' },
	{ key: 'campaigntype', label: 'Campaign Type' },
	{ key: 'from_email', label: 'From Email', format: 'email' },
	{ key: 'reply_to', label: 'Reply To', format: 'email' },
	{ key: 'campaign_preview', label: 'Preview URL', format: 'url' },
	{ key: 'created_date_string', label: 'Created Date' },
	{ key: 'created_time', label: 'Created Time', format: 'datetime' },
	{ key: 'created_time_gmt', label: 'Created Time (GMT)', format: 'datetime' },
	{ key: 'folder_id', label: 'Folder ID' },
	{ key: 'is_hybrid', label: 'Is Hybrid' },
	{ key: 'zuid', label: 'Owner User ID' },
];

const contactFields: OutputSchema['fields'] = [
	{ key: 'contact_email', label: 'Email', format: 'email' },
	{ key: 'firstname', label: 'First Name' },
	{ key: 'lastname', label: 'Last Name' },
	{ key: 'phone', label: 'Phone' },
	{ key: 'companyname', label: 'Company Name' },
	{ key: 'added_time', label: 'Added Date' },
	{ key: 'zuid', label: 'User ID' },
];

const listContactsResultFields: OutputSchema['fields'] = [
	{ key: 'listkey', label: 'List Key' },
	{ key: 'listname', label: 'List Name' },
	{ key: 'ignored_contacts', label: 'Ignored Contacts' },
	{ key: 'existing_contacts', label: 'Existing Contacts' },
	{ key: 'readd_contacts', label: 'Re-added Contacts' },
	{ key: 'url', label: 'URI' },
	{ key: 'status', label: 'Status' },
	{ key: 'code', label: 'Code' },
	{ key: 'version', label: 'API Version' },
];

const campaignReportFields: OutputSchema['fields'] = [
	{
		key: 'campaign-reports',
		label: 'Campaign Reports',
		labelKey: 'campaign_name',
		listItems: [
			{ key: 'campaign_name', label: 'Campaign Name' },
			{ key: 'emails_sent_count', label: 'Emails Sent', format: 'number' },
			{ key: 'delivered_count', label: 'Delivered', format: 'number' },
			{ key: 'delivered_percent', label: 'Delivered %', format: 'number' },
			{ key: 'opens_count', label: 'Opens', format: 'number' },
			{ key: 'open_percent', label: 'Open %', format: 'number' },
			{ key: 'unopened', label: 'Unopened', format: 'number' },
			{ key: 'unopened_percent', label: 'Unopened %', format: 'number' },
			{ key: 'unique_clicks_count', label: 'Unique Clicks', format: 'number' },
			{ key: 'unique_clicked_percent', label: 'Unique Click %', format: 'number' },
			{ key: 'clicksperopenrate', label: 'Clicks per Open %', format: 'number' },
			{ key: 'bounces_count', label: 'Bounces', format: 'number' },
			{ key: 'bounce_percent', label: 'Bounce %', format: 'number' },
			{ key: 'hardbounce_count', label: 'Hard Bounces', format: 'number' },
			{ key: 'softbounce_count', label: 'Soft Bounces', format: 'number' },
			{ key: 'unsub_count', label: 'Unsubscribes', format: 'number' },
			{ key: 'unsubscribe_percent', label: 'Unsubscribe %', format: 'number' },
			{ key: 'spams_count', label: 'Spam Reports', format: 'number' },
			{ key: 'spam_percent', label: 'Spam %', format: 'number' },
			{ key: 'complaints_count', label: 'Complaints', format: 'number' },
			{ key: 'complaints_percent', label: 'Complaint %', format: 'number' },
			{ key: 'forwards_count', label: 'Forwards', format: 'number' },
			{ key: 'forward_percent', label: 'Forward %', format: 'number' },
			{ key: 'autoreply_count', label: 'Auto Replies', format: 'number' },
			{ key: 'unsent_count', label: 'Unsent', format: 'number' },
			{ key: 'unsent_percent', label: 'Unsent %', format: 'number' },
		],
	},
	{
		key: 'campaign-details',
		label: 'Campaign Details',
		labelKey: 'campaign_name',
		listItems: [
			{ key: 'campaign_key', label: 'Campaign Key' },
			{ key: 'campaign_name', label: 'Campaign Name' },
			{ key: 'email_subject', label: 'Subject' },
			{ key: 'email_from', label: 'From Email', format: 'email' },
			{ key: 'reply_to', label: 'Reply To', format: 'email' },
			{ key: 'email_type', label: 'Email Type' },
			{ key: 'email_options', label: 'Email Options' },
			{ key: 'created_time', label: 'Created Time' },
			{ key: 'sent_time', label: 'Sent Time' },
		],
	},
	{
		key: 'campaign-reach',
		label: 'Campaign Reach',
		listItems: [
			{ key: 'total', label: 'Total', format: 'number' },
			{ key: 'emails', label: 'Emails', format: 'number' },
			{ key: 'facebook', label: 'Facebook', format: 'number' },
			{ key: 'twitter', label: 'Twitter', format: 'number' },
			{ key: 'linkedin', label: 'LinkedIn', format: 'number' },
			{ key: 'other', label: 'Other', format: 'number' },
		],
	},
	{ key: 'campaign-by-loaction', label: 'Opens by Location' },
	...statusFields,
];

export const zohoCampaignsStatusOutputSchema: OutputSchema = {
	fields: statusFields,
};

export const zohoCampaignsAddContactsToMailingListOutputSchema: OutputSchema = {
	fields: listContactsResultFields,
};

export const zohoCampaignsCreateCustomFieldOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'response',
			label: 'Response',
			children: [
				{ key: 'fieldname', label: 'Field Name' },
				{ key: 'fieldtype', label: 'Field Type' },
				{ key: 'fieldlength', label: 'Field Length', format: 'number' },
				{ key: 'decimallength', label: 'Decimal Length', format: 'number' },
				{ key: 'mandatory_check', label: 'Mandatory' },
				{ key: 'type', label: 'Response Type' },
				{ key: 'code', label: 'Code', format: 'number' },
				{ key: 'message', label: 'Message' },
				{ key: 'uri', label: 'URI' },
			],
		},
	],
};

export const zohoCampaignsListCampaignsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'recent_campaigns',
			label: 'Campaigns',
			labelKey: 'campaign_name',
			listItems: campaignSummaryFields,
		},
		{ key: 'count', label: 'Returned Count', format: 'number' },
		{ key: 'campaign_count', label: 'Campaign Count' },
		{ key: 'total_record_count', label: 'Total Record Count' },
		{ key: 'fromindex', label: 'From Index' },
		{ key: 'range', label: 'Range' },
		{ key: 'requestdetails', label: 'Request Details' },
		...responseFields,
	],
};

export const zohoCampaignsListSentCampaignsOutputSchema: OutputSchema = {
	fields: [{ key: 'recent_sent_campaigns', label: 'Recently Sent Campaigns' }, ...statusFields],
};

export const zohoCampaignsCloneCampaignOutputSchema: OutputSchema = {
	fields: [
		{ key: 'campaignkey', label: 'New Campaign Key' },
		{ key: 'created_date_string', label: 'Created Date' },
		{
			key: 'campaign-details',
			label: 'Campaign Details',
			labelKey: 'campaign_name',
			listItems: [
				{ key: 'campaign_name', label: 'Campaign Name' },
				{ key: 'email_subject', label: 'Subject' },
				{ key: 'email_from', label: 'From Email', format: 'email' },
				{ key: 'reply_to', label: 'Reply To', format: 'email' },
			],
		},
		{ key: 'url', label: 'URI' },
		{ key: 'status', label: 'Status' },
		{ key: 'code', label: 'Code' },
		{ key: 'version', label: 'API Version' },
	],
};

export const zohoCampaignsCreateCampaignOutputSchema: OutputSchema = {
	fields: [
		{ key: 'campaignKey', label: 'Campaign Key' },
		{ key: 'campaign_id', label: 'Campaign ID' },
		{ key: 'campaign_name', label: 'Campaign Name' },
		{ key: 'campaign_subject', label: 'Subject' },
		{ key: 'campaign_status', label: 'Campaign Status' },
		{ key: 'content_id', label: 'Content ID' },
		{ key: 'created_date', label: 'Created Date', format: 'datetime' },
		{ key: 'code', label: 'Code' },
		{ key: 'message', label: 'Message' },
		{ key: 'uri', label: 'URI' },
		{ key: 'version', label: 'API Version' },
	],
};

export const zohoCampaignsSendCampaignOutputSchema: OutputSchema = {
	fields: [
		{ key: 'campaign_status', label: 'Campaign Status' },
		{ key: 'code', label: 'Code' },
		{ key: 'message', label: 'Message' },
		{ key: 'uri', label: 'URI' },
		{ key: 'version', label: 'API Version' },
	],
};

export const zohoCampaignsCampaignReportOutputSchema: OutputSchema = {
	fields: campaignReportFields,
};

export const zohoCampaignsListCampaignRecipientsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'list_of_details',
			label: 'Recipients',
			labelKey: 'contactemailaddress',
			listItems: [
				{ key: 'contactemailaddress', label: 'Email', format: 'email' },
				{ key: 'contactid', label: 'Contact ID' },
				{ key: 'firstname', label: 'First Name' },
				{ key: 'lastname', label: 'Last Name' },
				{ key: 'companyname', label: 'Company Name' },
				{ key: 'phone', label: 'Phone' },
				{ key: 'contactstatus', label: 'Contact Status' },
				{ key: 'sentdate', label: 'Sent Date' },
				{ key: 'sent_time', label: 'Sent Time', format: 'datetime' },
				{ key: 'timezone', label: 'Time Zone' },
			],
		},
		{
			key: 'requestdetails',
			label: 'Request Details',
			children: [
				{ key: 'action', label: 'Activity' },
				{ key: 'fromindex', label: 'From Index', format: 'number' },
				{ key: 'range', label: 'Range', format: 'number' },
			],
		},
		...statusFields,
	],
};

export const zohoCampaignsGetCampaignOutputSchema: OutputSchema = {
	fields: [
		{ key: 'campaign_status', label: 'Campaign Status' },
		{ key: 'total_subscribers_count', label: 'Total Recipients', format: 'number' },
		{
			key: 'campaign-details',
			label: 'Campaign Details',
			labelKey: 'campaign_name',
			listItems: [
				{ key: 'campaign_key', label: 'Campaign Key' },
				{ key: 'campaign_name', label: 'Campaign Name' },
				{ key: 'email_subject', label: 'Subject' },
				{ key: 'preheader', label: 'Preheader' },
				{ key: 'email_from', label: 'From Email', format: 'email' },
				{ key: 'sender_name', label: 'Sender Name' },
				{ key: 'reply_to', label: 'Reply To', format: 'email' },
				{ key: 'campaigntype', label: 'Campaign Type' },
				{ key: 'email_type', label: 'Email Type' },
				{ key: 'email_options', label: 'Email Options' },
				{ key: 'topic_id', label: 'Topic ID' },
				{ key: 'topic_name', label: 'Topic Name' },
				{ key: 'campaignaction', label: 'Next Action' },
				{ key: 'schedule_type', label: 'Schedule Type' },
				{ key: 'campaign_preview', label: 'Preview URL', format: 'url' },
				{ key: 'folder_id', label: 'Folder ID' },
				{ key: 'created_date_string', label: 'Created Date' },
				{ key: 'created_time', label: 'Created Time' },
				{ key: 'created_time_gmt', label: 'Created Time (GMT)', format: 'datetime' },
				{ key: 'updated_date_string', label: 'Updated Date' },
				{ key: 'updated_time', label: 'Updated Time' },
				{ key: 'updated_time_gmt', label: 'Updated Time (GMT)', format: 'datetime' },
				{ key: 'modifieddate', label: 'Modified Date' },
				{ key: 'modified_time', label: 'Modified Time' },
				{ key: 'modified_time_gmt', label: 'Modified Time (GMT)', format: 'datetime' },
				{ key: 'encodeName', label: 'Encoding' },
				{ key: 'is_advance', label: 'Is Advanced' },
				{ key: 'advanceTypeString', label: 'Advanced Type' },
				{ key: 'is_hybrid', label: 'Is Hybrid' },
				{ key: 'isGAConfig', label: 'Google Analytics Configured' },
				{ key: 'isReplyTrackingEnabled', label: 'Reply Tracking Enabled' },
				{ key: 'isToNameConfig', label: 'To Name Configured' },
				{ key: 'isWistia', label: 'Has Wistia Video' },
				{ key: 'webAutoStatus', label: 'Web Auto Status' },
				{ key: 'zuid', label: 'Owner User ID' },
			],
		},
		{
			key: 'associated_mailing_lists',
			label: 'Mailing Lists',
			labelKey: 'listname',
			listItems: [
				{ key: 'listkey', label: 'List Key' },
				{ key: 'listname', label: 'List Name' },
				{ key: 'liststatus', label: 'List Status' },
				{ key: 'contactscount', label: 'Contacts' },
				{ key: 'no_of_unsubcontacts', label: 'Unsubscribed Contacts' },
				{ key: 'no_of_bounce', label: 'Bounced Contacts' },
			],
		},
		{ key: 'segments_info', label: 'Segments' },
		{ key: 'url', label: 'URI' },
		{ key: 'status', label: 'Status' },
		{ key: 'code', label: 'Code' },
		{ key: 'version', label: 'API Version' },
	],
};

export const zohoCampaignsListContactsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'list_of_details',
			label: 'Contacts',
			labelKey: 'contact_email',
			listItems: contactFields,
		},
		{ key: 'count', label: 'Returned Count', format: 'number' },
		{
			key: 'requestdetails',
			label: 'Request Details',
			children: [
				{ key: 'fromindex', label: 'From Index', format: 'number' },
				{ key: 'range', label: 'Range', format: 'number' },
				{ key: 'sort', label: 'Sort' },
				{ key: 'status', label: 'Contact Status' },
			],
		},
		...responseFields,
	],
};

export const zohoCampaignsCountContactsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'no_of_contacts', label: 'Number of Contacts', format: 'number' },
		...responseFields,
	],
};

export const zohoCampaignsListContactFieldsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'response',
			label: 'Response',
			children: [
				{
					key: 'fieldnames',
					label: 'Field Names',
					children: [
						{
							key: 'fieldname',
							label: 'Fields',
							labelKey: 'DISPLAY_NAME',
							listItems: [
								{ key: 'DISPLAY_NAME', label: 'Display Name' },
								{ key: 'FIELD_NAME', label: 'Field Name' },
								{ key: 'FIELD_DISPLAY_NAME', label: 'Field Constant' },
								{ key: 'FIELD_ID', label: 'Field ID', format: 'number' },
								{ key: 'UITYPE', label: 'UI Type' },
								{ key: 'TYPE', label: 'Type' },
								{ key: 'MAXLENGTH', label: 'Max Length', format: 'number' },
								{ key: 'IS_MANDATORY', label: 'Is Mandatory', format: 'boolean' },
								{ key: 'BLOCK_LABEL', label: 'Block' },
								{ key: 'SEQUENCE', label: 'Sequence', format: 'number' },
								{ key: 'block_sequence', label: 'Block Sequence', format: 'number' },
								{ key: 'is_otheruser_field', label: 'Is Other User Field', format: 'boolean' },
								{ key: 'no', label: 'Number', format: 'number' },
							],
						},
					],
				},
				{ key: 'code', label: 'Code', format: 'number' },
				{ key: 'message', label: 'Message' },
			],
		},
	],
};

export const zohoCampaignsFindCampaignOutputSchema: OutputSchema = {
	itemLabel: '{campaign_name}',
	fields: [
		{
			key: 'campaigns',
			label: 'Campaigns',
			value: '',
			listItems: campaignSummaryFields,
		},
	],
};

export const zohoCampaignsFindContactOutputSchema: OutputSchema = {
	itemLabel: '{contact_email}',
	fields: [
		{
			key: 'contacts',
			label: 'Contacts',
			value: '',
			listItems: contactFields,
		},
	],
};

export const zohoCampaignsGetMailingListDetailsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'contactDetails',
			label: 'List Details',
			children: [
				{ key: 'listname', label: 'List Name' },
				{ key: 'noofcontacts', label: 'Contacts' },
				{ key: 'ispublic', label: 'Is Public', format: 'boolean' },
				{ key: 'owner_name', label: 'Owner Name' },
				{ key: 'owner_email', label: 'Owner Email', format: 'email' },
				{ key: 'date', label: 'Created Date' },
				{ key: 'created_time_gmt', label: 'Created Time (GMT)', format: 'datetime' },
				{ key: 'segments', label: 'Segments' },
				{ key: 'zuid', label: 'Owner User ID', format: 'number' },
			],
		},
		{
			key: 'contact_stats',
			label: 'Contact Stats',
			children: [
				{ key: 'no_of_active', label: 'Active Contacts', format: 'number' },
				{ key: 'no_of_unsub', label: 'Unsubscribed Contacts', format: 'number' },
				{ key: 'no_of_bounce', label: 'Bounced Contacts', format: 'number' },
				{ key: 'sent_count', label: 'Campaigns Sent', format: 'number' },
				{ key: 'schedule_count', label: 'Campaigns Scheduled', format: 'number' },
			],
		},
		{ key: 'campaign_details', label: 'Campaigns' },
		{ key: 'localsubscribers', label: 'Subscribers by Location' },
		{ key: 'open_subscribers_location', label: 'Opens by Location' },
		{
			key: 'requestdetails',
			label: 'Request Details',
			children: [
				{ key: 'filtertype', label: 'Campaign Filter' },
				{ key: 'fromindex', label: 'From Index', format: 'number' },
				{ key: 'range', label: 'Range', format: 'number' },
			],
		},
		...responseFields,
	],
};

export const zohoCampaignsListMailingListsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'list_of_details',
			label: 'Mailing Lists',
			labelKey: 'listname',
			listItems: [
				{ key: 'listkey', label: 'List Key' },
				{ key: 'listname', label: 'List Name' },
				{ key: 'listdesc', label: 'Description' },
				{ key: 'noofcontacts', label: 'Contacts' },
				{ key: 'noofunsubcnt', label: 'Unsubscribed Contacts' },
				{ key: 'noofbouncecnt', label: 'Bounced Contacts' },
				{ key: 'sentcnt', label: 'Campaigns Sent' },
				{ key: 'list_campaigns_count', label: 'Campaigns' },
				{ key: 'segments', label: 'Segments' },
				{ key: 'is_public', label: 'Is Public' },
				{ key: 'owner', label: 'Owner' },
				{ key: 'lockstatus', label: 'Lock Status' },
				{ key: 'editable', label: 'Editable' },
				{ key: 'deletable', label: 'Deletable' },
				{ key: 'issmart', label: 'Is Smart List' },
				{ key: 'otherslist', label: 'Owned by Another User' },
				{ key: 'listtype', label: 'List Type' },
				{ key: 'servicetype', label: 'Service Type' },
				{ key: 'listnotifications', label: 'Notifications' },
				{ key: 'date', label: 'Created Date' },
				{ key: 'list_created_date', label: 'Created At', format: 'datetime' },
				{ key: 'list_created_time', label: 'Created Time', format: 'datetime' },
				{ key: 'created_time', label: 'Created Time (ms)', format: 'datetime' },
				{ key: 'created_time_gmt', label: 'Created Time (GMT)', format: 'datetime' },
				{ key: 'updated_time_gmt', label: 'Updated Time (GMT)', format: 'datetime' },
				{ key: 'listdgs', label: 'List Digest' },
				{ key: 'listunino', label: 'List Number' },
				{ key: 'sno', label: 'Serial Number' },
				{ key: 'zuid', label: 'Owner User ID' },
				{ key: 'zx', label: 'ZX' },
			],
		},
		{
			key: 'requestdetails',
			label: 'Request Details',
			children: [
				{ key: 'fromindex', label: 'From Index', format: 'number' },
				{ key: 'range', label: 'Range', format: 'number' },
				{ key: 'total_list_count', label: 'Total Lists', format: 'number' },
				{ key: 'sort', label: 'Sort' },
			],
		},
		...responseFields,
	],
};

export const zohoCampaignsNewCampaignOutputSchema: OutputSchema = {
	fields: campaignSummaryFields,
};

export const zohoCampaignsContactOutputSchema: OutputSchema = {
	fields: contactFields,
};

export const zohoCampaignsAddTagToContactOutputSchema: OutputSchema = {
	fields: [{ key: 'tagCreated', label: 'Tag Created', format: 'boolean' }, ...statusFields],
};

export const zohoCampaignsCreateTagOutputSchema: OutputSchema = {
	fields: [{ key: 'TagInfoId', label: 'Tag ID', format: 'number' }, ...statusFields],
};

export const zohoCampaignsListTagsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'tags',
			label: 'Tags',
			labelKey: 'tag_name',
			listItems: [
				{ key: 'tag_id', label: 'Tag ID' },
				{ key: 'tag_name', label: 'Tag Name' },
				{ key: 'tag_desc', label: 'Description' },
				{ key: 'tag_color', label: 'Color' },
				{ key: 'tagged_contact_count', label: 'Tagged Contacts' },
				{ key: 'tagowner', label: 'Owner' },
				{ key: 'tag_created_time', label: 'Created Time' },
				{ key: 'tag_modified_time', label: 'Modified Time' },
				{ key: 'is_crm_tag', label: 'Is CRM Tag' },
				{ key: 'zuid', label: 'Owner User ID' },
			],
		},
	],
};

export const zohoCampaignsCreateTopicOutputSchema: OutputSchema = {
	fields: [
		{ key: 'topic_id', label: 'Topic ID' },
		{ key: 'code', label: 'Code' },
		{ key: 'message', label: 'Message' },
		{ key: 'uri', label: 'URI' },
	],
};

export const zohoCampaignsListTopicsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'topicDetails',
			label: 'Topics',
			labelKey: 'topicName',
			listItems: [
				{ key: 'topicId', label: 'Topic ID' },
				{ key: 'topicName', label: 'Topic Name' },
				{ key: 'topicDesc', label: 'Description' },
			],
		},
		{ key: 'total_count', label: 'Total Topics', format: 'number' },
		{ key: 'code', label: 'Code' },
		{ key: 'message', label: 'Message' },
		{ key: 'uri', label: 'URI' },
	],
};
