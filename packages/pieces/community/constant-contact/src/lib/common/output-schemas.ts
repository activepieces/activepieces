import { OutputSchema } from '@activepieces/pieces-framework';

const emailAddressFields: OutputSchema['fields'] = [
	{ key: 'address', label: 'Email', format: 'email' },
	{ key: 'permission_to_send', label: 'Permission to Send', description: 'explicit, implicit, not_set, pending_confirmation, temp_hold or unsubscribed' },
	{ key: 'created_at', label: 'Email Added At', format: 'datetime' },
	{ key: 'updated_at', label: 'Email Updated At', format: 'datetime' },
	{ key: 'opt_in_source', label: 'Opt-in Source' },
	{ key: 'opt_in_date', label: 'Opt-in Date', format: 'datetime' },
	{ key: 'opt_out_source', label: 'Opt-out Source' },
	{ key: 'opt_out_date', label: 'Opt-out Date', format: 'datetime' },
	{ key: 'opt_out_reason', label: 'Opt-out Reason' },
	{ key: 'confirm_status', label: 'Confirm Status' },
];

const contactFields: OutputSchema['fields'] = [
	{ key: 'contact_id', label: 'Contact ID' },
	{ key: 'email_address', label: 'Email Address', children: emailAddressFields },
	{ key: 'first_name', label: 'First Name' },
	{ key: 'last_name', label: 'Last Name' },
	{ key: 'job_title', label: 'Job Title' },
	{ key: 'company_name', label: 'Company Name' },
	{ key: 'birthday_month', label: 'Birthday Month', format: 'number' },
	{ key: 'birthday_day', label: 'Birthday Day', format: 'number' },
	{ key: 'anniversary', label: 'Anniversary' },
	{ key: 'create_source', label: 'Created By' },
	{ key: 'update_source', label: 'Last Updated By' },
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'updated_at', label: 'Updated At', format: 'datetime' },
	{ key: 'deleted_at', label: 'Deleted On', format: 'date' },
	{
		key: 'phone_numbers',
		label: 'Phone Numbers',
		labelKey: 'phone_number',
		listItems: [
			{ key: 'phone_number_id', label: 'Phone Number ID' },
			{ key: 'phone_number', label: 'Phone Number' },
			{ key: 'kind', label: 'Type' },
			{ key: 'created_at', label: 'Created At', format: 'datetime' },
			{ key: 'updated_at', label: 'Updated At', format: 'datetime' },
		],
	},
	{
		key: 'street_addresses',
		label: 'Street Addresses',
		labelKey: 'street',
		listItems: [
			{ key: 'street_address_id', label: 'Street Address ID' },
			{ key: 'kind', label: 'Type' },
			{ key: 'street', label: 'Street' },
			{ key: 'city', label: 'City' },
			{ key: 'state', label: 'State' },
			{ key: 'postal_code', label: 'Postal Code' },
			{ key: 'country', label: 'Country' },
			{ key: 'created_at', label: 'Created At', format: 'datetime' },
			{ key: 'updated_at', label: 'Updated At', format: 'datetime' },
		],
	},
	{
		key: 'custom_fields',
		label: 'Custom Fields',
		labelKey: 'custom_field_id',
		listItems: [
			{ key: 'custom_field_id', label: 'Custom Field ID' },
			{ key: 'value', label: 'Value' },
		],
	},
	{ key: 'list_memberships', label: 'List IDs' },
	{ key: 'taggings', label: 'Tag IDs' },
];

const listFields: OutputSchema['fields'] = [
	{ key: 'list_id', label: 'List ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ key: 'favorite', label: 'Favorite', format: 'boolean' },
	{ key: 'membership_count', label: 'Members', format: 'number' },
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const tagFields: OutputSchema['fields'] = [
	{ key: 'tag_id', label: 'Tag ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'contacts_count', label: 'Contacts', format: 'number' },
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const customFieldFields: OutputSchema['fields'] = [
	{ key: 'custom_field_id', label: 'Custom Field ID' },
	{ key: 'label', label: 'Label' },
	{ key: 'name', label: 'Name' },
	{ key: 'type', label: 'Type' },
	{ key: 'version', label: 'Version', format: 'number' },
	{ key: 'choices', label: 'Choices', labelKey: 'choice_label', listItems: [{ key: 'choice_id', label: 'Choice ID' }, { key: 'choice_label', label: 'Label' }] },
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const activityFields: OutputSchema['fields'] = [
	{ key: 'activity_id', label: 'Activity ID' },
	{ key: 'state', label: 'State', description: 'initialized, processing, completed, cancelled, failed or timed_out' },
	{ key: 'percent_done', label: 'Percent Done', format: 'number' },
	{ key: 'activity_errors', label: 'Errors' },
	{
		key: 'status',
		label: 'Status',
		children: [
			{ key: 'items_total_count', label: 'Items Total', format: 'number' },
			{ key: 'items_completed_count', label: 'Items Completed', format: 'number' },
			{ key: 'list_count', label: 'Lists', format: 'number' },
		],
	},
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'started_at', label: 'Started At', format: 'datetime' },
	{ key: 'completed_at', label: 'Completed At', format: 'datetime' },
	{ key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const campaignSummaryFields: OutputSchema['fields'] = [
	{ key: 'campaign_id', label: 'Campaign ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'current_status', label: 'Status' },
	{ key: 'type', label: 'Type' },
	{ key: 'type_code', label: 'Type Code', format: 'number' },
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const campaignFields: OutputSchema['fields'] = [
	...campaignSummaryFields,
	{
		key: 'campaign_activities',
		label: 'Campaign Activities',
		labelKey: 'role',
		listItems: [
			{ key: 'campaign_activity_id', label: 'Campaign Activity ID' },
			{ key: 'role', label: 'Role' },
			{ key: 'document_id', label: 'Document ID', description: 'Returned when the draft is created; Get Email Campaign does not return it.' },
		],
	},
];

const statsFields: OutputSchema['fields'] = [
	{ key: 'em_sends', label: 'Sends', format: 'number' },
	{ key: 'em_opens', label: 'Unique Opens', format: 'number' },
	{ key: 'em_opens_all', label: 'All Opens', format: 'number' },
	{ key: 'em_opens_all_computer', label: 'All Opens on Computers', format: 'number' },
	{ key: 'em_opens_all_mobile', label: 'All Opens on Phones', format: 'number' },
	{ key: 'em_opens_all_tablet', label: 'All Opens on Tablets', format: 'number' },
	{ key: 'em_opens_all_other', label: 'All Opens on Other Devices', format: 'number' },
	{ key: 'em_opens_all_none', label: 'All Opens on Unknown Devices', format: 'number' },
	{ key: 'em_clicks', label: 'Unique Clicks', format: 'number' },
	{ key: 'em_clicks_all', label: 'All Clicks', format: 'number' },
	{ key: 'em_clicks_all_computer', label: 'All Clicks on Computers', format: 'number' },
	{ key: 'em_clicks_all_mobile', label: 'All Clicks on Phones', format: 'number' },
	{ key: 'em_clicks_all_tablet', label: 'All Clicks on Tablets', format: 'number' },
	{ key: 'em_clicks_all_other', label: 'All Clicks on Other Devices', format: 'number' },
	{ key: 'em_clicks_all_none', label: 'All Clicks on Unknown Devices', format: 'number' },
	{ key: 'em_bounces', label: 'Bounces', format: 'number' },
	{ key: 'em_optouts', label: 'Unsubscribes', format: 'number' },
	{ key: 'em_forwards', label: 'Forwards', format: 'number' },
	{ key: 'em_not_opened', label: 'Not Opened', format: 'number' },
];

const percentFields: OutputSchema['fields'] = [
	{ key: 'open', label: 'Open %', format: 'number' },
	{ key: 'click', label: 'Click %', format: 'number' },
	{ key: 'bounce', label: 'Bounce %', format: 'number' },
	{ key: 'unsubscribe', label: 'Unsubscribe %', format: 'number' },
	{ key: 'did_not_open', label: 'Did Not Open %', format: 'number' },
	{ key: 'desktop_open', label: 'Opens on Computers %', format: 'number' },
	{ key: 'mobile_open', label: 'Opens on Mobile %', format: 'number' },
	{ key: 'desktop_click', label: 'Clicks on Computers %', format: 'number' },
	{ key: 'mobile_click', label: 'Clicks on Mobile %', format: 'number' },
];

export const contactOutputSchema: OutputSchema = { fields: contactFields };

export const upsertContactOutputSchema: OutputSchema = {
	fields: [
		{ key: 'contact_id', label: 'Contact ID' },
		{ key: 'action', label: 'Action', description: 'created or updated' },
	],
};

export const findContactOutputSchema: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', format: 'boolean' },
		{ key: 'contact', label: 'Contact', children: contactFields },
	],
};

export const findContactsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'contacts', label: 'Contacts', labelKey: 'contact_id', listItems: contactFields },
		{ key: 'contacts_count', label: 'Total Matching', format: 'number' },
		{ key: 'next_cursor', label: 'Next Cursor' },
	],
};

export const deleteContactOutputSchema: OutputSchema = {
	fields: [
		{ key: 'contact_id', label: 'Contact ID' },
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
	],
};

export const activityOutputSchema: OutputSchema = { fields: activityFields };

export const listOutputSchema: OutputSchema = { fields: listFields };

export const listsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'lists', label: 'Lists', labelKey: 'name', listItems: listFields },
		{ key: 'next_cursor', label: 'Next Cursor' },
	],
};

export const tagOutputSchema: OutputSchema = { fields: tagFields };

export const tagsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'tags', label: 'Tags', labelKey: 'name', listItems: tagFields },
		{ key: 'next_cursor', label: 'Next Cursor' },
	],
};

export const customFieldsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'custom_fields', label: 'Custom Fields', labelKey: 'label', listItems: customFieldFields },
		{ key: 'next_cursor', label: 'Next Cursor' },
	],
};

export const accountEmailsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'emails',
			label: 'Sender Email Addresses',
			labelKey: 'email_address',
			listItems: [
				{ key: 'email_id', label: 'Email ID' },
				{ key: 'email_address', label: 'Email', format: 'email' },
				{ key: 'confirm_status', label: 'Confirm Status', description: 'CONFIRMED addresses can be used as a campaign sender' },
				{ key: 'confirm_time', label: 'Confirmed At', format: 'datetime' },
				{ key: 'confirm_source', label: 'Confirmed Via' },
				{ key: 'confirm_source_type', label: 'Confirmed By' },
				{ key: 'roles', label: 'Roles' },
				{ key: 'pending_roles', label: 'Pending Roles' },
			],
		},
	],
};

export const campaignsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'campaigns', label: 'Campaigns', labelKey: 'name', listItems: campaignSummaryFields },
		{ key: 'next_cursor', label: 'Next Cursor' },
	],
};

export const campaignOutputSchema: OutputSchema = { fields: campaignFields };

export const testEmailOutputSchema: OutputSchema = {
	fields: [
		{ key: 'campaign_activity_id', label: 'Campaign Activity ID' },
		{ key: 'sent_to', label: 'Sent To' },
	],
};

export const campaignStatsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'campaign_id',
			listItems: [
				{ key: 'campaign_id', label: 'Campaign ID' },
				{ key: 'stats', label: 'Counts', children: statsFields },
				{ key: 'percents', label: 'Percentages', children: percentFields },
				{ key: 'last_refresh_time', label: 'Last Refreshed', format: 'datetime' },
			],
		},
		{ key: 'errors', label: 'Errors', listItems: [{ key: 'error_key', label: 'Error Key' }, { key: 'error_message', label: 'Error Message' }] },
	],
};
