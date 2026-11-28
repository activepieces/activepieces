import { OutputSchema } from '@activepieces/pieces-framework';

const userFields: OutputSchema['fields'] = [
	{ key: 'name', label: 'Username' },
	{ key: 'key', label: 'User Key' },
	{ key: 'displayName', label: 'Display Name' },
	{ key: 'emailAddress', label: 'Email', format: 'email' },
	{ key: 'active', label: 'Active', format: 'boolean' },
	{ key: 'timeZone', label: 'Time Zone' },
];

const statusFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Status ID' },
	{ key: 'name', label: 'Status' },
	{ key: 'description', label: 'Description' },
	{
		key: 'statusCategory',
		label: 'Status Category',
		children: [
			{ key: 'key', label: 'Category Key' },
			{ key: 'name', label: 'Category Name' },
		],
	},
];

const issueFieldsFields: OutputSchema['fields'] = [
	{ key: 'summary', label: 'Summary' },
	{ key: 'description', label: 'Description' },
	{ key: 'status', label: 'Status', children: statusFields },
	{
		key: 'issuetype',
		label: 'Issue Type',
		children: [
			{ key: 'id', label: 'Issue Type ID' },
			{ key: 'name', label: 'Issue Type' },
			{ key: 'subtask', label: 'Subtask', format: 'boolean' },
		],
	},
	{
		key: 'priority',
		label: 'Priority',
		children: [
			{ key: 'id', label: 'Priority ID' },
			{ key: 'name', label: 'Priority' },
		],
	},
	{
		key: 'project',
		label: 'Project',
		children: [
			{ key: 'id', label: 'Project ID' },
			{ key: 'key', label: 'Project Key' },
			{ key: 'name', label: 'Project Name' },
		],
	},
	{ key: 'assignee', label: 'Assignee', children: userFields },
	{ key: 'reporter', label: 'Reporter', children: userFields },
	{ key: 'creator', label: 'Creator', children: userFields },
	{ key: 'labels', label: 'Labels' },
	{ key: 'created', label: 'Created', format: 'datetime' },
	{ key: 'updated', label: 'Updated', format: 'datetime' },
	{ key: 'duedate', label: 'Due Date', format: 'date' },
	{ key: 'resolutiondate', label: 'Resolved', format: 'datetime' },
	{
		key: 'resolution',
		label: 'Resolution',
		children: [
			{ key: 'id', label: 'Resolution ID' },
			{ key: 'name', label: 'Resolution' },
		],
	},
];

export const issueOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Issue ID' },
		{ key: 'key', label: 'Issue Key' },
		{ key: 'self', label: 'API URL', format: 'url' },
		{ key: 'fields', label: 'Fields', children: issueFieldsFields },
	],
};
