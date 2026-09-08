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
