import { OutputSchema } from '@activepieces/pieces-framework';

const leadFields: OutputSchema['fields'] = [
	{ key: 'lead_id', label: 'Lead ID' },
	{ key: 'form_id', label: 'Form ID' },
	{ key: 'platform', label: 'Platform' },
	{ key: 'ad_id', label: 'Ad ID' },
	{ key: 'ad_name', label: 'Ad Name' },
	{ key: 'adset_id', label: 'Ad Set ID' },
	{ key: 'adset_name', label: 'Ad Set Name' },
	{ key: 'campaign_id', label: 'Campaign ID' },
	{ key: 'campaign_name', label: 'Campaign Name' },
	{ key: 'created_time', label: 'Submitted At', format: 'datetime' },
	{
		key: 'data',
		label: 'Answers',
		dynamicKey: true,
		description: 'Answers keyed by the form question key, e.g. email, full_name, phone_number.',
	},
];

const formSummaryFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Form ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'status', label: 'Status' },
	{ key: 'locale', label: 'Locale' },
	{ key: 'created_time', label: 'Created At', format: 'datetime' },
	{ key: 'leads_count', label: 'Leads Count', format: 'number' },
];

export const facebookLeadsUpdateLeadFormStatusOutputSchema: OutputSchema = {
	fields: [
		{ key: 'form_id', label: 'Form ID' },
		{ key: 'status', label: 'Status' },
		{ key: 'success', label: 'Success', format: 'boolean' },
	],
};

export const facebookLeadsCreateLeadFormOutputSchema: OutputSchema = {
	fields: [{ key: 'id', label: 'Form ID' }],
};

export const facebookLeadsGetLeadFormOutputSchema: OutputSchema = {
	fields: [
		...formSummaryFields,
		{ key: 'expired_leads_count', label: 'Expired Leads Count', format: 'number' },
		{
			key: 'questions',
			label: 'Questions',
			labelKey: 'key',
			listItems: [
				{ key: 'id', label: 'Question ID' },
				{ key: 'key', label: 'Key' },
				{ key: 'label', label: 'Label' },
				{ key: 'type', label: 'Type' },
				{
					key: 'options',
					label: 'Options',
					labelKey: 'value',
					listItems: [
						{ key: 'key', label: 'Key' },
						{ key: 'value', label: 'Value' },
					],
				},
			],
		},
		{ key: 'privacy_policy_url', label: 'Privacy Policy URL', format: 'url' },
		{ key: 'follow_up_action_url', label: 'Follow-up URL', format: 'url' },
		{
			key: 'page',
			label: 'Page',
			children: [
				{ key: 'id', label: 'Page ID' },
				{ key: 'name', label: 'Name' },
			],
		},
	],
};

export const facebookLeadsGetLeadOutputSchema: OutputSchema = {
	fields: leadFields,
};

export const facebookLeadsListLeadFormsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'forms', label: 'Forms', labelKey: 'name', listItems: formSummaryFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const facebookLeadsListLeadsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'leads', label: 'Leads', labelKey: 'lead_id', listItems: leadFields },
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'next_cursor', label: 'Next Cursor' },
	],
};

export const facebookLeadsGetCurrentUserOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'User ID' },
		{ key: 'name', label: 'Name' },
	],
};

export const facebookLeadsListPagesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'pages',
			label: 'Pages',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'Page ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'category', label: 'Category' },
				{ key: 'tasks', label: 'Your Tasks on the Page' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};
