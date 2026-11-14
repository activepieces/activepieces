import { OutputSchema } from '@activepieces/pieces-framework';

const userFields: OutputSchema['fields'] = [
	{ key: 'account_id', label: 'Account ID', description: 'Jira Cloud only.' },
	{ key: 'username', label: 'Username', description: 'Jira Data Center only.' },
	{ key: 'name', label: 'Name' },
	{ key: 'email', label: 'Email', format: 'email' },
	{ key: 'active', label: 'Active', format: 'boolean' },
	{ key: 'time_zone', label: 'Time Zone' },
];

const requestFields: OutputSchema['fields'] = [
	{ key: 'issue_key', label: 'Request Key' },
	{ key: 'issue_id', label: 'Request ID' },
	{ key: 'summary', label: 'Summary' },
	{ key: 'description', label: 'Description' },
	{ key: 'status', label: 'Status' },
	{ key: 'status_category', label: 'Status Category' },
	{ key: 'status_changed_at', label: 'Status Changed At', format: 'datetime' },
	{ key: 'request_type_name', label: 'Request Type' },
	{ key: 'request_type_id', label: 'Request Type ID' },
	{ key: 'service_desk_id', label: 'Service Desk ID' },
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'reporter_name', label: 'Reporter Name' },
	{ key: 'reporter_email', label: 'Reporter Email', format: 'email' },
	{ key: 'reporter_account_id', label: 'Reporter Account ID', description: 'Jira Cloud only.' },
	{ key: 'reporter_username', label: 'Reporter Username', description: 'Jira Data Center only.' },
	{ key: 'portal_url', label: 'Portal Link', format: 'url' },
	{ key: 'agent_url', label: 'Agent Link', format: 'url' },
	{ key: 'fields', label: 'Request Fields', dynamicKey: true },
];

export const requestOutputSchema: OutputSchema = {
	fields: requestFields,
};

export const requestDetailsOutputSchema: OutputSchema = {
	fields: [
		...requestFields,
		{
			key: 'status_history',
			label: 'Status History',
			labelKey: 'status',
			listItems: [
				{ key: 'status', label: 'Status' },
				{ key: 'status_category', label: 'Status Category' },
				{ key: 'changed_at', label: 'Changed At', format: 'datetime' },
			],
		},
		{ key: 'participants', label: 'Participants', labelKey: 'name', listItems: userFields },
		{
			key: 'slas',
			label: 'SLAs',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'SLA ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'ongoing', label: 'Ongoing', format: 'boolean' },
				{ key: 'breached', label: 'Breached', format: 'boolean' },
				{ key: 'paused', label: 'Paused', format: 'boolean' },
				{ key: 'started_at', label: 'Started At', format: 'datetime' },
				{ key: 'breach_at', label: 'Breach At', format: 'datetime' },
				{ key: 'goal', label: 'Goal' },
				{ key: 'elapsed', label: 'Elapsed' },
				{ key: 'remaining', label: 'Remaining' },
				{ key: 'remaining_millis', label: 'Remaining (ms)', format: 'number' },
				{ key: 'completed_cycles', label: 'Completed Cycles', format: 'number' },
			],
		},
	],
};

export const requestListOutputSchema: OutputSchema = {
	itemLabel: '{issue_key}: {summary}',
	fields: [{ key: 'requests', label: 'Requests', value: '', listItems: requestFields }],
};

export const commentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'comment_id', label: 'Comment ID' },
		{ key: 'issue_key', label: 'Request Key' },
		{ key: 'body', label: 'Comment' },
		{ key: 'public', label: 'Visible to Customer', format: 'boolean' },
		{ key: 'author_name', label: 'Author Name' },
		{ key: 'author_email', label: 'Author Email', format: 'email' },
		{ key: 'author_account_id', label: 'Author Account ID', description: 'Jira Cloud only.' },
		{ key: 'author_username', label: 'Author Username', description: 'Jira Data Center only.' },
		{ key: 'created_at', label: 'Created At', format: 'datetime' },
	],
};

export const approvalOutputSchema: OutputSchema = {
	fields: [
		{ key: 'approval_id', label: 'Approval ID' },
		{ key: 'issue_key', label: 'Request Key' },
		{ key: 'name', label: 'Approval Name' },
		{ key: 'final_decision', label: 'Final Decision' },
		{ key: 'can_answer_approval', label: 'Can Still Answer', format: 'boolean' },
		{ key: 'created_at', label: 'Created At', format: 'datetime' },
		{ key: 'completed_at', label: 'Completed At', format: 'datetime' },
		{
			key: 'approvers',
			label: 'Approvers',
			labelKey: 'name',
			listItems: [
				{ key: 'name', label: 'Name' },
				{ key: 'email', label: 'Email', format: 'email' },
				{ key: 'account_id', label: 'Account ID', description: 'Jira Cloud only.' },
				{ key: 'username', label: 'Username', description: 'Jira Data Center only.' },
				{ key: 'decision', label: 'Decision' },
			],
		},
	],
};

export const customerOutputSchema: OutputSchema = {
	fields: userFields,
};

export const customersAddedOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'service_desk_id', label: 'Service Desk ID' },
		{ key: 'customers', label: 'Customers' },
	],
};

export const organizationOutputSchema: OutputSchema = {
	fields: [
		{ key: 'organization_id', label: 'Organization ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'service_desk_id', label: 'Added to Service Desk ID' },
	],
};

export const organizationAddedOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'service_desk_id', label: 'Service Desk ID' },
		{ key: 'organization_id', label: 'Organization ID' },
	],
};

export const participantsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'issue_key', label: 'Request Key' },
		{ key: 'participants', label: 'Participants', labelKey: 'name', listItems: userFields },
	],
};
