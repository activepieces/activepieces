import { OutputSchema } from '@activepieces/pieces-framework';

const contactChannelFields: OutputSchema['fields'] = [
	{ key: 'value', label: 'Value' },
	{ key: 'label', label: 'Label' },
	{ key: 'primary', label: 'Primary', format: 'boolean' },
];

const personCoreFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Person ID', format: 'number' },
	{ key: 'name', label: 'Name' },
	{ key: 'first_name', label: 'First Name' },
	{ key: 'last_name', label: 'Last Name' },
	{ key: 'emails', label: 'Emails', labelKey: 'value', listItems: contactChannelFields },
	{ key: 'phones', label: 'Phones', labelKey: 'value', listItems: contactChannelFields },
	{ key: 'org_id', label: 'Organization ID', format: 'number' },
	{ key: 'owner_id', label: 'Owner ID', format: 'number' },
	{ key: 'label_ids', label: 'Label IDs' },
	{ key: 'visible_to', label: 'Visible To' },
	{ key: 'is_deleted', label: 'Deleted', format: 'boolean' },
	{ key: 'add_time', label: 'Created At', format: 'datetime' },
	{ key: 'update_time', label: 'Updated At', format: 'datetime' },
];

const personStatsFields: OutputSchema['fields'] = [
	{ key: 'open_deals_count', label: 'Open Deals', format: 'number' },
	{ key: 'won_deals_count', label: 'Won Deals', format: 'number' },
	{ key: 'lost_deals_count', label: 'Lost Deals', format: 'number' },
	{ key: 'closed_deals_count', label: 'Closed Deals', format: 'number' },
	{ key: 'activities_count', label: 'Activities', format: 'number' },
	{ key: 'done_activities_count', label: 'Done Activities', format: 'number' },
	{ key: 'undone_activities_count', label: 'Undone Activities', format: 'number' },
	{ key: 'notes_count', label: 'Notes', format: 'number' },
	{ key: 'files_count', label: 'Files', format: 'number' },
	{ key: 'followers_count', label: 'Followers', format: 'number' },
	{ key: 'last_activity_id', label: 'Last Activity ID', format: 'number' },
	{ key: 'next_activity_id', label: 'Next Activity ID', format: 'number' },
	{ key: 'last_incoming_mail_time', label: 'Last Incoming Mail', format: 'datetime' },
	{ key: 'last_outgoing_mail_time', label: 'Last Outgoing Mail', format: 'datetime' },
];

const personDetailFields: OutputSchema['fields'] = [...personCoreFields, ...personStatsFields];

const dealCoreFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Deal ID', format: 'number' },
	{ key: 'title', label: 'Title' },
	{ key: 'value', label: 'Value', format: 'number' },
	{ key: 'currency', label: 'Currency' },
	{ key: 'status', label: 'Status' },
	{ key: 'probability', label: 'Probability', format: 'number' },
	{ key: 'stage_id', label: 'Stage ID', format: 'number' },
	{ key: 'pipeline_id', label: 'Pipeline ID', format: 'number' },
	{ key: 'person_id', label: 'Person ID', format: 'number' },
	{ key: 'org_id', label: 'Organization ID', format: 'number' },
	{ key: 'owner_id', label: 'Owner ID', format: 'number' },
	{ key: 'creator_user_id', label: 'Creator User ID', format: 'number' },
	{ key: 'label_ids', label: 'Label IDs' },
	{ key: 'expected_close_date', label: 'Expected Close Date', format: 'date' },
	{ key: 'close_time', label: 'Closed At', format: 'datetime' },
	{ key: 'won_time', label: 'Won At', format: 'datetime' },
	{ key: 'lost_time', label: 'Lost At', format: 'datetime' },
	{ key: 'lost_reason', label: 'Lost Reason' },
	{ key: 'stage_change_time', label: 'Stage Changed At', format: 'datetime' },
	{ key: 'mrr', label: 'MRR', format: 'number' },
	{ key: 'arr', label: 'ARR', format: 'number' },
	{ key: 'acv', label: 'ACV', format: 'number' },
	{ key: 'is_archived', label: 'Archived', format: 'boolean' },
	{ key: 'is_deleted', label: 'Deleted', format: 'boolean' },
	{ key: 'visible_to', label: 'Visible To' },
	{ key: 'add_time', label: 'Created At', format: 'datetime' },
	{ key: 'update_time', label: 'Updated At', format: 'datetime' },
];

const dealStatsFields: OutputSchema['fields'] = [
	{ key: 'activities_count', label: 'Activities', format: 'number' },
	{ key: 'done_activities_count', label: 'Done Activities', format: 'number' },
	{ key: 'undone_activities_count', label: 'Undone Activities', format: 'number' },
	{ key: 'notes_count', label: 'Notes', format: 'number' },
	{ key: 'files_count', label: 'Files', format: 'number' },
	{ key: 'followers_count', label: 'Followers', format: 'number' },
	{ key: 'participants_count', label: 'Participants', format: 'number' },
	{ key: 'products_count', label: 'Products', format: 'number' },
	{ key: 'last_activity_id', label: 'Last Activity ID', format: 'number' },
	{ key: 'next_activity_id', label: 'Next Activity ID', format: 'number' },
	{ key: 'smart_bcc_email', label: 'Smart BCC Email', format: 'email' },
];

const dealDetailFields: OutputSchema['fields'] = [...dealCoreFields, ...dealStatsFields];

const organizationCoreFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Organization ID', format: 'number' },
	{ key: 'name', label: 'Name' },
	{ key: 'address', label: 'Address' },
	{ key: 'website', label: 'Website', format: 'url' },
	{ key: 'linkedin', label: 'LinkedIn', format: 'url' },
	{ key: 'industry', label: 'Industry' },
	{ key: 'employee_count', label: 'Employees', format: 'number' },
	{ key: 'annual_revenue', label: 'Annual Revenue', format: 'number' },
	{ key: 'owner_id', label: 'Owner ID', format: 'number' },
	{ key: 'label_ids', label: 'Label IDs' },
	{ key: 'visible_to', label: 'Visible To' },
	{ key: 'is_deleted', label: 'Deleted', format: 'boolean' },
	{ key: 'add_time', label: 'Created At', format: 'datetime' },
	{ key: 'update_time', label: 'Updated At', format: 'datetime' },
];

const organizationStatsFields: OutputSchema['fields'] = [
	{ key: 'people_count', label: 'People', format: 'number' },
	{ key: 'open_deals_count', label: 'Open Deals', format: 'number' },
	{ key: 'won_deals_count', label: 'Won Deals', format: 'number' },
	{ key: 'lost_deals_count', label: 'Lost Deals', format: 'number' },
	{ key: 'closed_deals_count', label: 'Closed Deals', format: 'number' },
	{ key: 'activities_count', label: 'Activities', format: 'number' },
	{ key: 'notes_count', label: 'Notes', format: 'number' },
	{ key: 'files_count', label: 'Files', format: 'number' },
	{ key: 'followers_count', label: 'Followers', format: 'number' },
	{ key: 'last_activity_id', label: 'Last Activity ID', format: 'number' },
	{ key: 'next_activity_id', label: 'Next Activity ID', format: 'number' },
];

const organizationDetailFields: OutputSchema['fields'] = [
	...organizationCoreFields,
	...organizationStatsFields,
];

const activityFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Activity ID', format: 'number' },
	{ key: 'subject', label: 'Subject' },
	{ key: 'type', label: 'Type' },
	{ key: 'done', label: 'Done', format: 'boolean' },
	{ key: 'due_date', label: 'Due Date', format: 'date' },
	{ key: 'due_time', label: 'Due Time' },
	{ key: 'duration', label: 'Duration', format: 'duration' },
	{ key: 'priority', label: 'Priority' },
	{ key: 'note', label: 'Note', format: 'html' },
	{ key: 'public_description', label: 'Public Description' },
	{ key: 'location', label: 'Location' },
	{ key: 'outcome', label: 'Outcome' },
	{ key: 'busy', label: 'Busy', format: 'boolean' },
	{ key: 'deal_id', label: 'Deal ID', format: 'number' },
	{ key: 'person_id', label: 'Person ID', format: 'number' },
	{ key: 'org_id', label: 'Organization ID', format: 'number' },
	{ key: 'lead_id', label: 'Lead ID' },
	{ key: 'owner_id', label: 'Owner ID', format: 'number' },
	{ key: 'creator_user_id', label: 'Creator User ID', format: 'number' },
	{ key: 'participants', label: 'Participants' },
	{ key: 'conference_meeting_url', label: 'Meeting URL', format: 'url' },
	{ key: 'marked_as_done_time', label: 'Marked Done At', format: 'datetime' },
	{ key: 'is_deleted', label: 'Deleted', format: 'boolean' },
	{ key: 'add_time', label: 'Created At', format: 'datetime' },
	{ key: 'update_time', label: 'Updated At', format: 'datetime' },
];

const productPriceFields: OutputSchema['fields'] = [
	{ key: 'price', label: 'Price', format: 'number' },
	{ key: 'currency', label: 'Currency' },
	{ key: 'cost', label: 'Cost', format: 'number' },
	{ key: 'direct_cost', label: 'Direct Cost', format: 'number' },
	{ key: 'notes', label: 'Notes' },
];

const productFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Product ID', format: 'number' },
	{ key: 'name', label: 'Name' },
	{ key: 'code', label: 'Code' },
	{ key: 'description', label: 'Description' },
	{ key: 'unit', label: 'Unit' },
	{ key: 'tax', label: 'Tax', format: 'number' },
	{ key: 'category', label: 'Category' },
	{ key: 'prices', label: 'Prices', labelKey: 'currency', listItems: productPriceFields },
	{ key: 'billing_frequency', label: 'Billing Frequency' },
	{ key: 'billing_frequency_cycles', label: 'Billing Cycles', format: 'number' },
	{ key: 'is_linkable', label: 'Linkable', format: 'boolean' },
	{ key: 'is_deleted', label: 'Deleted', format: 'boolean' },
	{ key: 'owner_id', label: 'Owner ID', format: 'number' },
	{ key: 'visible_to', label: 'Visible To' },
	{ key: 'add_time', label: 'Created At', format: 'datetime' },
	{ key: 'update_time', label: 'Updated At', format: 'datetime' },
];

const productSearchFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Product ID', format: 'number' },
	{ key: 'name', label: 'Name' },
	{ key: 'code', label: 'Code' },
	{ key: 'tax', label: 'Tax', format: 'number' },
	{ key: 'type', label: 'Type' },
	{ key: 'owner', label: 'Owner' },
	{ key: 'visible_to', label: 'Visible To' },
	{ key: 'custom_fields', label: 'Custom Fields', dynamicKey: true },
];

const noteFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Note ID', format: 'number' },
	{ key: 'content', label: 'Content', format: 'html' },
	{ key: 'deal_id', label: 'Deal ID', format: 'number' },
	{ key: 'person_id', label: 'Person ID', format: 'number' },
	{ key: 'org_id', label: 'Organization ID', format: 'number' },
	{ key: 'lead_id', label: 'Lead ID' },
	{
		key: 'deal',
		label: 'Deal',
		children: [{ key: 'title', label: 'Title' }],
	},
	{
		key: 'user',
		label: 'Author',
		children: [
			{ key: 'name', label: 'Name' },
			{ key: 'email', label: 'Email', format: 'email' },
		],
	},
	{ key: 'user_id', label: 'Author ID', format: 'number' },
	{ key: 'last_update_user_id', label: 'Last Updated By', format: 'number' },
	{ key: 'pinned_to_deal_flag', label: 'Pinned to Deal', format: 'boolean' },
	{ key: 'pinned_to_person_flag', label: 'Pinned to Person', format: 'boolean' },
	{ key: 'pinned_to_organization_flag', label: 'Pinned to Organization', format: 'boolean' },
	{ key: 'active_flag', label: 'Active', format: 'boolean' },
	{ key: 'add_time', label: 'Created At', format: 'datetime' },
	{ key: 'update_time', label: 'Updated At', format: 'datetime' },
];

const leadFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Lead ID' },
	{ key: 'title', label: 'Title' },
	{ key: 'value', label: 'Value' },
	{ key: 'owner_id', label: 'Owner ID', format: 'number' },
	{ key: 'creator_id', label: 'Creator ID', format: 'number' },
	{ key: 'person_id', label: 'Person ID', format: 'number' },
	{ key: 'organization_id', label: 'Organization ID', format: 'number' },
	{ key: 'label_ids', label: 'Label IDs' },
	{ key: 'expected_close_date', label: 'Expected Close Date', format: 'date' },
	{ key: 'source_name', label: 'Source' },
	{ key: 'channel', label: 'Channel' },
	{ key: 'cc_email', label: 'CC Email', format: 'email' },
	{ key: 'was_seen', label: 'Seen', format: 'boolean' },
	{ key: 'is_archived', label: 'Archived', format: 'boolean' },
	{ key: 'next_activity_id', label: 'Next Activity ID', format: 'number' },
	{ key: 'visible_to', label: 'Visible To' },
	{ key: 'add_time', label: 'Created At', format: 'datetime' },
	{ key: 'update_time', label: 'Updated At', format: 'datetime' },
];

const leadSearchFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Lead ID' },
	{ key: 'title', label: 'Title' },
	{ key: 'type', label: 'Type' },
	{ key: 'value', label: 'Value', format: 'number' },
	{ key: 'currency', label: 'Currency' },
	{ key: 'person', label: 'Person' },
	{ key: 'organization', label: 'Organization' },
	{ key: 'owner', label: 'Owner' },
	{ key: 'emails', label: 'Emails' },
	{ key: 'phones', label: 'Phones' },
	{ key: 'notes', label: 'Notes' },
	{ key: 'is_archived', label: 'Archived', format: 'boolean' },
	{ key: 'visible_to', label: 'Visible To' },
	{ key: 'custom_fields', label: 'Custom Fields', dynamicKey: true },
];

const userFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'User ID', format: 'number' },
	{ key: 'name', label: 'Name' },
	{ key: 'email', label: 'Email', format: 'email' },
];

const dealProductFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Deal Product ID', format: 'number' },
	{ key: 'deal_id', label: 'Deal ID', format: 'number' },
	{ key: 'product_id', label: 'Product ID', format: 'number' },
	{ key: 'name', label: 'Name' },
	{ key: 'item_price', label: 'Item Price', format: 'number' },
	{ key: 'quantity', label: 'Quantity', format: 'number' },
	{ key: 'sum', label: 'Sum', format: 'number' },
	{ key: 'currency', label: 'Currency' },
	{ key: 'discount', label: 'Discount', format: 'number' },
	{ key: 'discount_type', label: 'Discount Type' },
	{ key: 'tax', label: 'Tax', format: 'number' },
	{ key: 'tax_method', label: 'Tax Method' },
	{ key: 'comments', label: 'Comments' },
	{ key: 'order_nr', label: 'Order Number', format: 'number' },
	{ key: 'is_enabled', label: 'Enabled', format: 'boolean' },
	{ key: 'add_time', label: 'Created At', format: 'datetime' },
	{ key: 'update_time', label: 'Updated At', format: 'datetime' },
];

const followerFields: OutputSchema['fields'] = [
	{ key: 'user_id', label: 'User ID', format: 'number' },
	{ key: 'add_time', label: 'Followed At', format: 'datetime' },
];

const fileFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'File ID', format: 'number' },
	{ key: 'name', label: 'Name' },
	{ key: 'file_name', label: 'Stored File Name' },
	{ key: 'file_type', label: 'File Type' },
	{ key: 'file_size', label: 'File Size', format: 'number' },
	{ key: 'url', label: 'Download URL', format: 'url' },
	{ key: 'description', label: 'Description' },
	{ key: 'user_id', label: 'User ID', format: 'number' },
	{ key: 'active_flag', label: 'Active', format: 'boolean' },
	{ key: 'inline_flag', label: 'Inline', format: 'boolean' },
	{ key: 'remote_location', label: 'Remote Location' },
	{ key: 'remote_id', label: 'Remote ID' },
	{ key: 'deal_id', label: 'Deal ID', format: 'number' },
	{ key: 'deal_name', label: 'Deal Name' },
	{ key: 'lead_id', label: 'Lead ID' },
	{ key: 'lead_name', label: 'Lead Name' },
	{ key: 'person_id', label: 'Person ID', format: 'number' },
	{ key: 'person_name', label: 'Person Name' },
	{ key: 'org_id', label: 'Organization ID', format: 'number' },
	{ key: 'org_name', label: 'Organization Name' },
	{ key: 'product_id', label: 'Product ID', format: 'number' },
	{ key: 'product_name', label: 'Product Name' },
	{ key: 'activity_id', label: 'Activity ID', format: 'number' },
	{ key: 'log_id', label: 'Log ID', format: 'number' },
	{ key: 'mail_message_id', label: 'Mail Message ID', format: 'number' },
	{ key: 'mail_template_id', label: 'Mail Template ID', format: 'number' },
	{ key: 'cid', label: 'Content ID' },
	{ key: 'add_time', label: 'Created At', format: 'datetime' },
	{ key: 'update_time', label: 'Updated At', format: 'datetime' },
];

const idNameFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'ID', format: 'number' },
	{ key: 'name', label: 'Name' },
];

const orgWithAddressFields: OutputSchema['fields'] = [
	...idNameFields,
	{ key: 'address', label: 'Address' },
];

const searchScoreField: OutputSchema['fields'] = [
	{ key: 'result_score', label: 'Result Score', format: 'number' },
];

const dealSearchItemFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Deal ID', format: 'number' },
	{ key: 'type', label: 'Type' },
	{ key: 'title', label: 'Title' },
	{ key: 'value', label: 'Value', format: 'number' },
	{ key: 'currency', label: 'Currency' },
	{ key: 'status', label: 'Status' },
	{ key: 'is_archived', label: 'Archived', format: 'boolean' },
	{ key: 'visible_to', label: 'Visible To' },
	{ key: 'owner', label: 'Owner', children: [{ key: 'id', label: 'Owner ID', format: 'number' }] },
	{ key: 'stage', label: 'Stage', children: idNameFields },
	{ key: 'pipeline', label: 'Pipeline', children: [{ key: 'id', label: 'Pipeline ID', format: 'number' }] },
	{ key: 'person', label: 'Person', children: idNameFields },
	{ key: 'organization', label: 'Organization', children: orgWithAddressFields },
	{ key: 'custom_fields', label: 'Custom Fields' },
	{ key: 'notes', label: 'Notes' },
	...searchScoreField,
];

const personSearchItemFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Person ID', format: 'number' },
	{ key: 'type', label: 'Type' },
	{ key: 'name', label: 'Name' },
	{ key: 'phones', label: 'Phones' },
	{ key: 'emails', label: 'Emails' },
	{ key: 'primary_email', label: 'Primary Email', format: 'email' },
	{ key: 'visible_to', label: 'Visible To' },
	{ key: 'owner', label: 'Owner', children: [{ key: 'id', label: 'Owner ID', format: 'number' }] },
	{ key: 'organization', label: 'Organization', children: orgWithAddressFields },
	{ key: 'custom_fields', label: 'Custom Fields' },
	{ key: 'notes', label: 'Notes' },
	{ key: 'update_time', label: 'Updated At', format: 'datetime' },
	...searchScoreField,
];

const organizationSearchItemFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Organization ID', format: 'number' },
	{ key: 'type', label: 'Type' },
	{ key: 'name', label: 'Name' },
	{ key: 'address', label: 'Address' },
	{ key: 'visible_to', label: 'Visible To' },
	{ key: 'owner', label: 'Owner', children: [{ key: 'id', label: 'Owner ID', format: 'number' }] },
	{ key: 'custom_fields', label: 'Custom Fields' },
	{ key: 'notes', label: 'Notes' },
	...searchScoreField,
];

const pipelineFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Pipeline ID', format: 'number' },
	{ key: 'name', label: 'Name' },
	{ key: 'order_nr', label: 'Order', format: 'number' },
	{ key: 'is_deal_probability_enabled', label: 'Deal Probability Enabled', format: 'boolean' },
	{ key: 'is_deleted', label: 'Deleted', format: 'boolean' },
	{ key: 'add_time', label: 'Created At', format: 'datetime' },
	{ key: 'update_time', label: 'Updated At', format: 'datetime' },
];

const stageFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Stage ID', format: 'number' },
	{ key: 'name', label: 'Name' },
	{ key: 'pipeline_id', label: 'Pipeline ID', format: 'number' },
	{ key: 'order_nr', label: 'Order', format: 'number' },
	{ key: 'deal_probability', label: 'Deal Probability', format: 'number' },
	{ key: 'is_deal_rot_enabled', label: 'Rotting Enabled', format: 'boolean' },
	{ key: 'days_to_rotten', label: 'Days to Rotten', format: 'number' },
	{ key: 'is_deleted', label: 'Deleted', format: 'boolean' },
	{ key: 'add_time', label: 'Created At', format: 'datetime' },
	{ key: 'update_time', label: 'Updated At', format: 'datetime' },
];

const activityTypeFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Activity Type ID', format: 'number' },
	{ key: 'name', label: 'Name' },
	{ key: 'key_string', label: 'Key' },
	{ key: 'icon_key', label: 'Icon' },
	{ key: 'color', label: 'Color' },
	{ key: 'order_nr', label: 'Order', format: 'number' },
	{ key: 'active_flag', label: 'Active', format: 'boolean' },
	{ key: 'is_custom_flag', label: 'Custom', format: 'boolean' },
	{ key: 'add_time', label: 'Created At' },
	{ key: 'update_time', label: 'Updated At' },
];

const userDetailFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'User ID', format: 'number' },
	{ key: 'name', label: 'Name' },
	{ key: 'email', label: 'Email', format: 'email' },
	{ key: 'phone', label: 'Phone' },
	{ key: 'active_flag', label: 'Active', format: 'boolean' },
	{ key: 'is_deleted', label: 'Deleted', format: 'boolean' },
	{ key: 'has_created_company', label: 'Has Created Company', format: 'boolean' },
	{
		key: 'access',
		label: 'Access',
		labelKey: 'app',
		listItems: [
			{ key: 'app', label: 'App' },
			{ key: 'admin', label: 'Admin', format: 'boolean' },
			{ key: 'permission_set_id', label: 'Permission Set ID' },
		],
	},
	{ key: 'is_admin', label: 'Admin' },
	{ key: 'role_id', label: 'Role ID', format: 'number' },
	{ key: 'default_currency', label: 'Default Currency' },
	{ key: 'locale', label: 'Locale' },
	{ key: 'lang', label: 'Language ID', format: 'number' },
	{ key: 'timezone_name', label: 'Timezone' },
	{ key: 'timezone_offset', label: 'Timezone Offset' },
	{ key: 'icon_url', label: 'Icon URL', format: 'url' },
	{ key: 'is_you', label: 'Is Connected User', format: 'boolean' },
	{ key: 'last_login', label: 'Last Login' },
	{ key: 'created', label: 'Created At' },
	{ key: 'modified', label: 'Updated At' },
];

const currentUserFields: OutputSchema['fields'] = [
	...userDetailFields,
	{ key: 'company_id', label: 'Company ID', format: 'number' },
	{ key: 'company_name', label: 'Company Name' },
	{ key: 'company_domain', label: 'Company Domain' },
	{ key: 'company_country', label: 'Company Country' },
	{
		key: 'language',
		label: 'Language',
		children: [
			{ key: 'language_code', label: 'Language Code' },
			{ key: 'country_code', label: 'Country Code' },
		],
	},
];

const leadConversionFields: OutputSchema['fields'] = [
	{ key: 'conversion_id', label: 'Conversion ID' },
	{ key: 'status', label: 'Status' },
	{ key: 'deal_id', label: 'Deal ID', format: 'number' },
];

const deleteResultFields: OutputSchema['fields'] = [{ key: 'id', label: 'Deleted ID' }];

const customFieldsField: OutputSchema['fields'] = [
	{ key: 'custom_fields', label: 'Custom Fields', dynamicKey: true },
];

const dealExtraFields: OutputSchema['fields'] = [
	{ key: 'archive_time', label: 'Archived At', format: 'datetime' },
	{ key: 'channel', label: 'Channel' },
	{ key: 'channel_id', label: 'Channel ID' },
	{ key: 'origin', label: 'Origin' },
	{ key: 'origin_id', label: 'Origin ID' },
	{ key: 'local_close_date', label: 'Local Close Date', format: 'date' },
	{ key: 'local_won_date', label: 'Local Won Date', format: 'date' },
	{ key: 'local_lost_date', label: 'Local Lost Date', format: 'date' },
];

const atomicDealListFields: OutputSchema['fields'] = [
	...dealCoreFields,
	...dealExtraFields,
	...customFieldsField,
];

const atomicDealDetailFields: OutputSchema['fields'] = [
	...dealDetailFields,
	...dealExtraFields,
	{ key: 'first_won_time', label: 'First Won At', format: 'datetime' },
	{ key: 'email_messages_count', label: 'Email Messages', format: 'number' },
	{ key: 'last_incoming_mail_time', label: 'Last Incoming Mail', format: 'datetime' },
	{ key: 'last_outgoing_mail_time', label: 'Last Outgoing Mail', format: 'datetime' },
];

const relatedDealCountFields: OutputSchema['fields'] = [
	{ key: 'related_open_deals_count', label: 'Related Open Deals', format: 'number' },
	{ key: 'related_closed_deals_count', label: 'Related Closed Deals', format: 'number' },
	{ key: 'related_won_deals_count', label: 'Related Won Deals', format: 'number' },
	{ key: 'related_lost_deals_count', label: 'Related Lost Deals', format: 'number' },
	{ key: 'email_messages_count', label: 'Email Messages', format: 'number' },
];

const atomicPersonListFields: OutputSchema['fields'] = [
	...personCoreFields,
	{ key: 'picture_id', label: 'Picture ID', format: 'number' },
	...customFieldsField,
];

const atomicPersonDetailFields: OutputSchema['fields'] = [
	...personDetailFields,
	...relatedDealCountFields,
	{ key: 'picture_id', label: 'Picture ID', format: 'number' },
	{ key: 'participant_open_deals_count', label: 'Participant Open Deals', format: 'number' },
	{ key: 'participant_closed_deals_count', label: 'Participant Closed Deals', format: 'number' },
];

const atomicOrganizationListFields: OutputSchema['fields'] = [
	...organizationCoreFields,
	...customFieldsField,
];

const mergedRecordFields: OutputSchema['fields'] = [
	{ key: 'merge_what_id', label: 'Merged-Away Record ID', format: 'number' },
];

const mergedOrganizationFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Surviving Organization ID', format: 'number' },
];

const atomicOrganizationDetailFields: OutputSchema['fields'] = [
	...organizationDetailFields,
	...relatedDealCountFields,
	{ key: 'done_activities_count', label: 'Done Activities', format: 'number' },
	{ key: 'undone_activities_count', label: 'Undone Activities', format: 'number' },
];

const atomicActivityListFields: OutputSchema['fields'] = [
	...activityFields,
	{ key: 'private', label: 'Private', format: 'boolean' },
	{ key: 'project_id', label: 'Project ID', format: 'number' },
	{ key: 'conference_meeting_client', label: 'Meeting Client' },
	{ key: 'conference_meeting_id', label: 'Meeting ID' },
	...customFieldsField,
];

const atomicActivityDetailFields: OutputSchema['fields'] = [
	...atomicActivityListFields,
	{ key: 'attendees', label: 'Attendees' },
];

const atomicLeadFields: OutputSchema['fields'] = [
	...leadFields,
	{ key: 'archive_time', label: 'Archived At', format: 'datetime' },
	{ key: 'archive_reason', label: 'Archive Reason' },
	{ key: 'channel_id', label: 'Channel ID' },
	{ key: 'origin', label: 'Origin' },
	{ key: 'origin_id', label: 'Origin ID' },
	{ key: 'source_deal_id', label: 'Source Deal ID', format: 'number' },
];

const atomicNoteFields: OutputSchema['fields'] = [
	...noteFields.filter((field) => field.key !== 'user'),
	{
		key: 'user',
		label: 'Author',
		children: [
			{ key: 'name', label: 'Name' },
			{ key: 'email', label: 'Email', format: 'email' },
			{ key: 'icon_url', label: 'Icon URL', format: 'url' },
			{ key: 'is_you', label: 'Is Connected User', format: 'boolean' },
		],
	},
	{ key: 'lead', label: 'Lead', children: [{ key: 'title', label: 'Title' }] },
	{ key: 'person', label: 'Person', children: [{ key: 'name', label: 'Name' }] },
	{ key: 'organization', label: 'Organization', children: [{ key: 'name', label: 'Name' }] },
	{ key: 'pinned_to_lead_flag', label: 'Pinned to Lead', format: 'boolean' },
	{ key: 'pinned_to_project_flag', label: 'Pinned to Project', format: 'boolean' },
	{ key: 'pinned_to_task_flag', label: 'Pinned to Task', format: 'boolean' },
	{ key: 'project_id', label: 'Project ID', format: 'number' },
	{ key: 'task_id', label: 'Task ID', format: 'number' },
];

const atomicDealProductFields: OutputSchema['fields'] = [
	...dealProductFields,
	{ key: 'billing_frequency', label: 'Billing Frequency' },
	{ key: 'billing_frequency_cycles', label: 'Billing Cycles', format: 'number' },
	{ key: 'billing_start_date', label: 'Billing Start Date', format: 'date' },
	{ key: 'product_variation_id', label: 'Product Variation ID', format: 'number' },
];

const mergedDealV1Fields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Surviving Deal ID', format: 'number' },
	{ key: 'title', label: 'Title' },
	{ key: 'value', label: 'Value', format: 'number' },
	{ key: 'formatted_value', label: 'Formatted Value' },
	{ key: 'currency', label: 'Currency' },
	{ key: 'status', label: 'Status' },
	{ key: 'pipeline_id', label: 'Pipeline ID', format: 'number' },
	{ key: 'stage_id', label: 'Stage ID', format: 'number' },
	{ key: 'stage_order_nr', label: 'Stage Order', format: 'number' },
	{ key: 'person_id', label: 'Person' },
	{ key: 'person_name', label: 'Person Name' },
	{ key: 'org_id', label: 'Organization' },
	{ key: 'org_name', label: 'Organization Name' },
	{ key: 'user_id', label: 'Owner User ID', format: 'number' },
	{ key: 'owner_name', label: 'Owner Name' },
	{ key: 'creator_user_id', label: 'Creator User ID', format: 'number' },
	{ key: 'probability', label: 'Probability', format: 'number' },
	{ key: 'weighted_value', label: 'Weighted Value', format: 'number' },
	{ key: 'expected_close_date', label: 'Expected Close Date', format: 'date' },
	{ key: 'close_time', label: 'Closed At', format: 'datetime' },
	{ key: 'won_time', label: 'Won At', format: 'datetime' },
	{ key: 'first_won_time', label: 'First Won At', format: 'datetime' },
	{ key: 'lost_time', label: 'Lost At', format: 'datetime' },
	{ key: 'lost_reason', label: 'Lost Reason' },
	{ key: 'label', label: 'Label' },
	{ key: 'active', label: 'Active', format: 'boolean' },
	{ key: 'deleted', label: 'Deleted', format: 'boolean' },
	{ key: 'is_archived', label: 'Archived', format: 'boolean' },
	{ key: 'visible_to', label: 'Visible To' },
	{ key: 'add_time', label: 'Created At', format: 'datetime' },
	{ key: 'update_time', label: 'Updated At', format: 'datetime' },
	{ key: 'stage_change_time', label: 'Stage Changed At', format: 'datetime' },
	{ key: 'next_activity_id', label: 'Next Activity ID', format: 'number' },
	{ key: 'next_activity_date', label: 'Next Activity Date', format: 'date' },
	{ key: 'next_activity_subject', label: 'Next Activity Subject' },
	{ key: 'last_activity_id', label: 'Last Activity ID', format: 'number' },
	{ key: 'last_activity_date', label: 'Last Activity Date', format: 'date' },
	{ key: 'activities_count', label: 'Activities', format: 'number' },
	{ key: 'done_activities_count', label: 'Done Activities', format: 'number' },
	{ key: 'undone_activities_count', label: 'Undone Activities', format: 'number' },
	{ key: 'notes_count', label: 'Notes', format: 'number' },
	{ key: 'files_count', label: 'Files', format: 'number' },
	{ key: 'followers_count', label: 'Followers', format: 'number' },
	{ key: 'participants_count', label: 'Participants', format: 'number' },
	{ key: 'products_count', label: 'Products', format: 'number' },
	{ key: 'email_messages_count', label: 'Email Messages', format: 'number' },
	{ key: 'cc_email', label: 'Smart BCC Email', format: 'email' },
	{ key: 'origin', label: 'Origin' },
	{ key: 'source_lead_id', label: 'Source Lead ID' },
];

const mergedPersonV1Fields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Surviving Person ID', format: 'number' },
	{ key: 'name', label: 'Name' },
	{ key: 'first_name', label: 'First Name' },
	{ key: 'last_name', label: 'Last Name' },
	{ key: 'primary_email', label: 'Primary Email', format: 'email' },
	{ key: 'email', label: 'Emails', labelKey: 'value', listItems: contactChannelFields },
	{ key: 'phone', label: 'Phones', labelKey: 'value', listItems: contactChannelFields },
	{ key: 'org_id', label: 'Organization' },
	{ key: 'org_name', label: 'Organization Name' },
	{ key: 'owner_id', label: 'Owner ID', format: 'number' },
	{ key: 'owner_name', label: 'Owner Name' },
	{ key: 'job_title', label: 'Job Title' },
	{ key: 'birthday', label: 'Birthday', format: 'date' },
	{ key: 'label', label: 'Label' },
	{ key: 'label_ids', label: 'Label IDs' },
	{ key: 'visible_to', label: 'Visible To' },
	{ key: 'active_flag', label: 'Active', format: 'boolean' },
	{ key: 'add_time', label: 'Created At', format: 'datetime' },
	{ key: 'update_time', label: 'Updated At', format: 'datetime' },
	{ key: 'open_deals_count', label: 'Open Deals', format: 'number' },
	{ key: 'won_deals_count', label: 'Won Deals', format: 'number' },
	{ key: 'lost_deals_count', label: 'Lost Deals', format: 'number' },
	{ key: 'closed_deals_count', label: 'Closed Deals', format: 'number' },
	{ key: 'activities_count', label: 'Activities', format: 'number' },
	{ key: 'done_activities_count', label: 'Done Activities', format: 'number' },
	{ key: 'undone_activities_count', label: 'Undone Activities', format: 'number' },
	{ key: 'notes_count', label: 'Notes', format: 'number' },
	{ key: 'files_count', label: 'Files', format: 'number' },
	{ key: 'followers_count', label: 'Followers', format: 'number' },
	{ key: 'email_messages_count', label: 'Email Messages', format: 'number' },
	{ key: 'last_activity_id', label: 'Last Activity ID', format: 'number' },
	{ key: 'next_activity_id', label: 'Next Activity ID', format: 'number' },
	{ key: 'next_activity_date', label: 'Next Activity Date', format: 'date' },
	{ key: 'last_incoming_mail_time', label: 'Last Incoming Mail', format: 'datetime' },
	{ key: 'last_outgoing_mail_time', label: 'Last Outgoing Mail', format: 'datetime' },
	{ key: 'postal_address_formatted_address', label: 'Postal Address' },
	{ key: 'cc_email', label: 'Smart BCC Email', format: 'email' },
];

const goalFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Goal ID' },
	{ key: 'title', label: 'Title' },
	{ key: 'owner_id', label: 'Owner ID', format: 'number' },
	{ key: 'is_active', label: 'Active', format: 'boolean' },
	{ key: 'interval', label: 'Interval' },
	{
		key: 'assignee',
		label: 'Assignee',
		children: [
			{ key: 'id', label: 'Assignee ID', format: 'number' },
			{ key: 'type', label: 'Assignee Type' },
		],
	},
	{
		key: 'type',
		label: 'Goal Type',
		children: [
			{ key: 'name', label: 'Type' },
			{
				key: 'params',
				label: 'Type Settings',
				children: [
					{ key: 'pipeline_id', label: 'Pipeline IDs' },
					{ key: 'stage_id', label: 'Stage ID', format: 'number' },
					{ key: 'activity_type_id', label: 'Activity Type IDs' },
				],
			},
		],
	},
	{
		key: 'expected_outcome',
		label: 'Expected Outcome',
		children: [
			{ key: 'target', label: 'Target', format: 'number' },
			{ key: 'tracking_metric', label: 'Tracking Metric' },
			{ key: 'currency_id', label: 'Currency ID', format: 'number' },
		],
	},
	{
		key: 'duration',
		label: 'Duration',
		children: [
			{ key: 'start', label: 'Start Date', format: 'date' },
			{ key: 'end', label: 'End Date', format: 'date' },
		],
	},
	{ key: 'report_ids', label: 'Report IDs' },
];

const callLogFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Call Log ID' },
	{ key: 'outcome', label: 'Outcome' },
	{ key: 'to_phone_number', label: 'To Phone Number' },
	{ key: 'from_phone_number', label: 'From Phone Number' },
	{ key: 'duration', label: 'Duration (seconds)' },
	{ key: 'start_time', label: 'Start Time', format: 'datetime' },
	{ key: 'end_time', label: 'End Time', format: 'datetime' },
	{ key: 'has_recording', label: 'Has Recording', format: 'boolean' },
	{ key: 'activity_id', label: 'Activity ID', format: 'number' },
	{ key: 'person_id', label: 'Person ID', format: 'number' },
	{ key: 'org_id', label: 'Organization ID', format: 'number' },
	{ key: 'deal_id', label: 'Deal ID', format: 'number' },
	{ key: 'lead_id', label: 'Lead ID' },
	{ key: 'user_id', label: 'User ID', format: 'number' },
	{ key: 'company_id', label: 'Company ID', format: 'number' },
	{ key: 'note', label: 'Note' },
];

function v1Envelope({
	label,
	fields,
}: {
	label: string;
	fields: OutputSchema['fields'];
}): OutputSchema {
	return {
		fields: [
			...envelope(label, fields).fields,
			{ key: 'additional_data', label: 'Additional Data' },
		],
	};
}

function envelope(label: string, fields: OutputSchema['fields']): OutputSchema {
	return {
		fields: [
			{ key: 'success', label: 'Success', format: 'boolean' },
			{ key: 'data', label, children: fields },
		],
	};
}

function search({
	label,
	fields,
	labelKey,
}: {
	label: string;
	fields: OutputSchema['fields'];
	labelKey: string;
}): OutputSchema {
	return {
		fields: [
			{ key: 'found', label: 'Found', format: 'boolean' },
			{ key: 'data', label, labelKey, listItems: fields },
		],
	};
}

function page({
	label,
	fields,
	labelKey,
}: {
	label: string;
	fields: OutputSchema['fields'];
	labelKey: string;
}): OutputSchema {
	return {
		fields: [
			...search({ label, fields, labelKey }).fields,
			{ key: 'next_cursor', label: 'Next Cursor' },
		],
	};
}

export const createPersonActionOutputSchema = envelope('Person', personCoreFields);
export const updatePersonActionOutputSchema = envelope('Person', personCoreFields);
export const addLabelsToPersonActionOutputSchema = envelope('Person', personCoreFields);
export const createDealActionOutputSchema = envelope('Deal', dealCoreFields);
export const updateDealActionOutputSchema = envelope('Deal', dealCoreFields);
export const createOrganizationActionOutputSchema = envelope('Organization', organizationCoreFields);
export const updateOrganizationActionOutputSchema = envelope('Organization', organizationCoreFields);
export const createActivityActionOutputSchema = envelope('Activity', activityFields);
export const updateActivityActionOutputSchema = envelope('Activity', activityFields);
export const createProductActionOutputSchema = envelope('Product', productFields);
export const updateProductActionOutputSchema = envelope('Product', productFields);
export const addProductToDealActionOutputSchema = envelope('Deal Product', dealProductFields);
export const createNoteActionOutputSchema = envelope('Note', noteFields);
export const getNoteActionOutputSchema = envelope('Note', noteFields);
export const createLeadActionOutputSchema = envelope('Lead', leadFields);
export const updateLeadActionOutputSchema = envelope('Lead', leadFields);

export const findPersonActionOutputSchema = search({
	label: 'People',
	fields: personDetailFields,
	labelKey: 'name',
});
export const findDealActionOutputSchema = search({
	label: 'Deals',
	fields: dealDetailFields,
	labelKey: 'title',
});
export const findDealsAssociatedWithPersonActionOutputSchema = search({
	label: 'Deals',
	fields: dealDetailFields,
	labelKey: 'title',
});
export const findOrganizationActionOutputSchema = search({
	label: 'Organizations',
	fields: organizationDetailFields,
	labelKey: 'name',
});
export const findActivityActionOutputSchema = search({
	label: 'Activities',
	fields: activityFields,
	labelKey: 'subject',
});
export const findNotesActionOutputSchema = search({
	label: 'Notes',
	fields: noteFields,
	labelKey: 'content',
});
export const findLeadActionOutputSchema = search({
	label: 'Leads',
	fields: leadSearchFields,
	labelKey: 'title',
});
export const findUserActionOutputSchema = search({
	label: 'Users',
	fields: userFields,
	labelKey: 'name',
});
export const getProductActionOutputSchema = search({
	label: 'Products',
	fields: productFields,
	labelKey: 'name',
});
export const findProductActionOutputSchema = search({
	label: 'Products',
	fields: productFields,
	labelKey: 'name',
});
export const findProductsActionOutputSchema = search({
	label: 'Products',
	fields: productSearchFields,
	labelKey: 'name',
});
export const addFollowerActionOutputSchema = envelope('Follower', followerFields);
export const attachFileActionOutputSchema = envelope('File', fileFields);

export const getDealActionOutputSchema = envelope('Deal', atomicDealDetailFields);
export const getPersonActionOutputSchema = envelope('Person', atomicPersonDetailFields);
export const getOrganizationActionOutputSchema = envelope('Organization', atomicOrganizationDetailFields);
export const mergeDealsActionOutputSchema = envelope('Surviving Deal', [
	...mergedDealV1Fields,
	...mergedRecordFields,
]);
export const mergePersonsActionOutputSchema = envelope('Surviving Person', [
	...mergedPersonV1Fields,
	...mergedRecordFields,
]);
export const mergeOrganizationsActionOutputSchema = envelope(
	'Surviving Organization',
	mergedOrganizationFields
);
export const addGoalActionOutputSchema = envelope('Goal Envelope', [
	{ key: 'goal', label: 'Goal', children: goalFields },
]);
export const updateGoalActionOutputSchema = envelope('Goal Envelope', [
	{ key: 'goal', label: 'Goal', children: goalFields },
]);
export const findGoalsActionOutputSchema = search({ label: 'Goals', fields: goalFields, labelKey: 'title' });
export const getGoalResultActionOutputSchema = envelope('Goal Result', [
	{ key: 'goal', label: 'Goal', children: goalFields },
	{ key: 'progress', label: 'Progress', format: 'number' },
]);
export const addCallLogActionOutputSchema = envelope('Call Log', callLogFields);
export const getCallLogActionOutputSchema = envelope('Call Log', callLogFields);
export const listCallLogsActionOutputSchema: OutputSchema = {
	fields: [
		...search({ label: 'Call Logs', fields: callLogFields, labelKey: 'to_phone_number' }).fields,
		{ key: 'more_items_in_collection', label: 'More Items', format: 'boolean' },
		{ key: 'next_start', label: 'Next Start', format: 'number' },
	],
};
export const getActivityActionOutputSchema = envelope('Activity', atomicActivityDetailFields);
export const getLeadActionOutputSchema = v1Envelope({ label: 'Lead', fields: atomicLeadFields });
export const updateNoteActionOutputSchema = envelope('Note', atomicNoteFields);
export const getCurrentUserActionOutputSchema = v1Envelope({ label: 'User', fields: currentUserFields });
export const getLeadConversionStatusActionOutputSchema = v1Envelope({ label: 'Conversion', fields: leadConversionFields });
export const convertLeadToDealActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'conversion_id', label: 'Conversion ID' },
		{ key: 'lead_id', label: 'Lead ID' },
	],
};
export const deleteRecordActionOutputSchema = envelope('Deleted Record', deleteResultFields);
export const deleteRecordWithAdditionalDataActionOutputSchema = v1Envelope({ label: 'Deleted Record', fields: deleteResultFields });
export const deleteNoteActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'data', label: 'Deleted', format: 'boolean' },
	],
};
export const listDealsActionOutputSchema = page({
	label: 'Deals',
	fields: atomicDealListFields,
	labelKey: 'title',
});
export const searchDealsActionOutputSchema = page({
	label: 'Deals',
	fields: dealSearchItemFields,
	labelKey: 'title',
});
export const listDealProductsActionOutputSchema = page({
	label: 'Deal Products',
	fields: atomicDealProductFields,
	labelKey: 'name',
});
export const listPersonsActionOutputSchema = page({
	label: 'People',
	fields: atomicPersonListFields,
	labelKey: 'name',
});
export const searchPersonsActionOutputSchema = page({
	label: 'People',
	fields: personSearchItemFields,
	labelKey: 'name',
});
export const listOrganizationsActionOutputSchema = page({
	label: 'Organizations',
	fields: atomicOrganizationListFields,
	labelKey: 'name',
});
export const searchOrganizationsActionOutputSchema = page({
	label: 'Organizations',
	fields: organizationSearchItemFields,
	labelKey: 'name',
});
export const listActivitiesActionOutputSchema = page({
	label: 'Activities',
	fields: atomicActivityListFields,
	labelKey: 'subject',
});
export const listPipelinesActionOutputSchema = page({
	label: 'Pipelines',
	fields: pipelineFields,
	labelKey: 'name',
});
export const listStagesActionOutputSchema = page({
	label: 'Stages',
	fields: stageFields,
	labelKey: 'name',
});
export const listActivityTypesActionOutputSchema = search({
	label: 'Activity Types',
	fields: activityTypeFields,
	labelKey: 'name',
});
export const listUsersActionOutputSchema = search({
	label: 'Users',
	fields: userDetailFields,
	labelKey: 'name',
});

export const newPersonTriggerOutputSchema: OutputSchema = { fields: personDetailFields };
export const updatedPersonTriggerOutputSchema: OutputSchema = { fields: personDetailFields };
export const newDealTriggerOutputSchema: OutputSchema = { fields: dealDetailFields };
export const updatedDealTriggerOutputSchema: OutputSchema = { fields: dealDetailFields };
export const updatedDealStageTriggerOutputSchema: OutputSchema = { fields: dealDetailFields };
export const newOrganizationTriggerOutputSchema: OutputSchema = {
	fields: organizationDetailFields,
};
export const updatedOrganizationTriggerOutputSchema: OutputSchema = {
	fields: organizationDetailFields,
};
export const newActivityTriggerOutputSchema: OutputSchema = { fields: activityFields };
export const newNoteTriggerOutputSchema: OutputSchema = { fields: noteFields };
export const newLeadTriggerOutputSchema: OutputSchema = { fields: leadFields };
export const personMatchingFilterTriggerOutputSchema: OutputSchema = {
	fields: personDetailFields,
};
export const dealMatchingFilterTriggerOutputSchema: OutputSchema = { fields: dealDetailFields };
export const organizationMatchingFilterTriggerOutputSchema: OutputSchema = {
	fields: organizationDetailFields,
};
export const activityMatchingFilterTriggerOutputSchema: OutputSchema = {
	fields: activityFields,
};
