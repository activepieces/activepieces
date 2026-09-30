import { OutputSchema } from '@activepieces/pieces-framework';

const userFields: OutputSchema['fields'] = [
	{ key: 'accountId', label: 'Account ID' },
	{ key: 'displayName', label: 'Display Name' },
	{ key: 'emailAddress', label: 'Email', format: 'email' },
	{ key: 'active', label: 'Active', format: 'boolean' },
	{ key: 'timeZone', label: 'Time Zone' },
	{ key: 'accountType', label: 'Account Type' },
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

const attachmentFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Attachment ID' },
	{ key: 'filename', label: 'File Name' },
	{ key: 'mimeType', label: 'MIME Type' },
	{ key: 'size', label: 'Size', format: 'filesize' },
	{ key: 'content', label: 'Content URL', format: 'url' },
	{ key: 'thumbnail', label: 'Thumbnail URL', format: 'image' },
	{ key: 'created', label: 'Created', format: 'datetime' },
	{ key: 'author', label: 'Author', children: userFields },
];

const versionFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Version ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ key: 'released', label: 'Released', format: 'boolean' },
	{ key: 'archived', label: 'Archived', format: 'boolean' },
	{ key: 'overdue', label: 'Overdue', format: 'boolean' },
	{ key: 'startDate', label: 'Start Date', format: 'date' },
	{ key: 'releaseDate', label: 'Release Date', format: 'date' },
	{ key: 'projectId', label: 'Project ID' },
];

const issueVersionFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Version ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ key: 'released', label: 'Released', format: 'boolean' },
	{ key: 'archived', label: 'Archived', format: 'boolean' },
	{ key: 'releaseDate', label: 'Release Date', format: 'date' },
];

const issueFieldsFields: OutputSchema['fields'] = [
	{ key: 'summary', label: 'Summary' },
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
	{
		key: 'parent',
		label: 'Parent',
		children: [
			{ key: 'id', label: 'Parent ID' },
			{ key: 'key', label: 'Parent Key' },
		],
	},
	{ key: 'description', label: 'Description (Atlassian Document Format)' },
	{ key: 'fixVersions', label: 'Fix Versions', labelKey: 'name', listItems: issueVersionFields },
	{ key: 'components', label: 'Components' },
	{ key: 'attachment', label: 'Attachments', labelKey: 'filename', listItems: attachmentFields },
	{
		key: 'issuelinks',
		label: 'Issue Links',
		listItems: [
			{ key: 'id', label: 'Link ID' },
			{
				key: 'type',
				label: 'Link Type',
				children: [
					{ key: 'name', label: 'Name' },
					{ key: 'inward', label: 'Inward Description' },
					{ key: 'outward', label: 'Outward Description' },
				],
			},
			{ key: 'inwardIssue', label: 'Inward Issue', children: [{ key: 'key', label: 'Issue Key' }] },
			{ key: 'outwardIssue', label: 'Outward Issue', children: [{ key: 'key', label: 'Issue Key' }] },
		],
	},
	{
		key: 'subtasks',
		label: 'Subtasks',
		labelKey: 'key',
		listItems: [
			{ key: 'id', label: 'Issue ID' },
			{ key: 'key', label: 'Issue Key' },
		],
	},
];

const issueFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Issue ID' },
	{ key: 'key', label: 'Issue Key' },
	{ key: 'self', label: 'API URL', format: 'url' },
	{ key: 'fields', label: 'Fields', children: issueFieldsFields },
];

const issueSummaryFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Issue ID' },
	{ key: 'key', label: 'Issue Key' },
	{ key: 'summary', label: 'Summary' },
];

const commentFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Comment ID' },
	{ key: 'author', label: 'Author', children: userFields },
	{ key: 'updateAuthor', label: 'Last Updated By', children: userFields },
	{ key: 'renderedBody', label: 'Body (HTML)', format: 'html' },
	{ key: 'body', label: 'Body (Atlassian Document Format)' },
	{ key: 'created', label: 'Created', format: 'datetime' },
	{ key: 'updated', label: 'Updated', format: 'datetime' },
	{ key: 'jsdPublic', label: 'Public', format: 'boolean' },
];

const worklogFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Worklog ID' },
	{ key: 'issueId', label: 'Issue ID' },
	{ key: 'timeSpent', label: 'Time Spent' },
	{ key: 'timeSpentSeconds', label: 'Time Spent (Seconds)', format: 'number' },
	{ key: 'started', label: 'Started', format: 'datetime' },
	{ key: 'created', label: 'Created', format: 'datetime' },
	{ key: 'updated', label: 'Updated', format: 'datetime' },
	{ key: 'author', label: 'Author', children: userFields },
	{ key: 'comment', label: 'Comment (Atlassian Document Format)' },
];

const projectFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Project ID' },
	{ key: 'key', label: 'Project Key' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ key: 'projectTypeKey', label: 'Project Type' },
	{ key: 'style', label: 'Style' },
	{ key: 'simplified', label: 'Team-Managed', format: 'boolean' },
	{ key: 'isPrivate', label: 'Private', format: 'boolean' },
	{
		key: 'lead',
		label: 'Lead',
		children: [
			{ key: 'accountId', label: 'Account ID' },
			{ key: 'displayName', label: 'Display Name' },
		],
	},
];

const issueTypeFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Issue Type ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ key: 'subtask', label: 'Subtask', format: 'boolean' },
	{ key: 'hierarchyLevel', label: 'Hierarchy Level', format: 'number' },
	{ key: 'iconUrl', label: 'Icon', format: 'image' },
];

const priorityFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Priority ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ key: 'statusColor', label: 'Color' },
	{ key: 'iconUrl', label: 'Icon', format: 'image' },
	{ key: 'isDefault', label: 'Default', format: 'boolean' },
];

const sprintFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Sprint ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'state', label: 'State' },
	{ key: 'goal', label: 'Goal' },
	{ key: 'startDate', label: 'Start Date', format: 'datetime' },
	{ key: 'endDate', label: 'End Date', format: 'datetime' },
	{ key: 'completeDate', label: 'Completed', format: 'datetime' },
	{ key: 'createdDate', label: 'Created', format: 'datetime' },
	{ key: 'originBoardId', label: 'Board ID' },
];

const filterFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Filter ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ key: 'jql', label: 'JQL' },
	{ key: 'viewUrl', label: 'View URL', format: 'url' },
	{ key: 'favourite', label: 'Favourite', format: 'boolean' },
	{
		key: 'owner',
		label: 'Owner',
		children: [
			{ key: 'accountId', label: 'Account ID' },
			{ key: 'displayName', label: 'Display Name' },
		],
	},
];

const pageMetaFields: OutputSchema['fields'] = [
	{ key: 'count', label: 'Returned', format: 'number' },
	{ key: 'start_at', label: 'Start At', format: 'number' },
	{ key: 'max_results', label: 'Max Results', format: 'number' },
	{ key: 'total', label: 'Total', format: 'number' },
	{ key: 'is_last', label: 'Last Page', format: 'boolean' },
];

const countField: OutputSchema['fields'][number] = { key: 'count', label: 'Returned', format: 'number' };

const successFields: OutputSchema['fields'] = [
	{ key: 'success', label: 'Success', format: 'boolean' },
	{ key: 'issue', label: 'Issue' },
];

export const issueOutputSchema: OutputSchema = { fields: issueFields };

export const issueListOutputSchema: OutputSchema = {
	itemLabel: '{key}: {fields.summary}',
	fields: [{ key: 'issues', label: 'Issues', value: '', listItems: issueFields }],
};

export const searchIssuesByJqlOutputSchema: OutputSchema = {
	fields: [
		{ key: 'items', label: 'Issues', labelKey: 'key', listItems: issueFields },
		countField,
		{ key: 'next_page_token', label: 'Next Page Token' },
		{ key: 'is_last', label: 'Last Page', format: 'boolean' },
	],
};

export const bulkGetIssuesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'issues', label: 'Issues', labelKey: 'key', listItems: issueFields },
		{ key: 'issue_errors', label: 'Issue Errors' },
		countField,
	],
};

export const createdIssueOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Issue ID' },
		{ key: 'key', label: 'Issue Key' },
		{ key: 'self', label: 'API URL', format: 'url' },
		{ key: 'browse_url', label: 'Issue URL', format: 'url' },
	],
};

export const bulkCreateIssuesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'issues',
			label: 'Created Issues',
			labelKey: 'key',
			listItems: [
				{ key: 'id', label: 'Issue ID' },
				{ key: 'key', label: 'Issue Key' },
				{ key: 'self', label: 'API URL', format: 'url' },
			],
		},
		{ key: 'errors', label: 'Errors' },
		{ key: 'created_count', label: 'Created', format: 'number' },
		{ key: 'failed_count', label: 'Failed', format: 'number' },
	],
};

export const countIssuesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'count', label: 'Approximate Count', format: 'number' },
		{ key: 'jql', label: 'JQL' },
	],
};

export const deleteIssueOutputSchema: OutputSchema = {
	fields: [...successFields, { key: 'deleted', label: 'Deleted', format: 'boolean' }],
};

export const assignIssueToUserOutputSchema: OutputSchema = {
	fields: [...successFields, { key: 'assignee_account_id', label: 'Assignee Account ID' }],
};

export const transitionIssueStatusOutputSchema: OutputSchema = {
	fields: [
		...successFields,
		{ key: 'transition_id', label: 'Transition ID' },
		{ key: 'status', label: 'New Status', children: statusFields },
	],
};

export const createIssueLinkOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'link_type', label: 'Link Type' },
		{ key: 'outward_issue', label: 'Outward Issue' },
		{ key: 'inward_issue', label: 'Inward Issue' },
	],
};

export const watcherChangeOutputSchema: OutputSchema = {
	fields: [...successFields, { key: 'account_id', label: 'Account ID' }],
};

export const issueWatchersOutputSchema: OutputSchema = {
	fields: [
		{ key: 'items', label: 'Watchers', labelKey: 'displayName', listItems: userFields },
		countField,
		{ key: 'watch_count', label: 'Watch Count', format: 'number' },
		{ key: 'is_watching', label: 'You Are Watching', format: 'boolean' },
	],
};

export const issueVotesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'votes', label: 'Votes', format: 'number' },
		{ key: 'hasVoted', label: 'You Have Voted', format: 'boolean' },
		{ key: 'voters', label: 'Voters', labelKey: 'displayName', listItems: userFields },
	],
};

export const remoteIssueLinksOutputSchema: OutputSchema = {
	fields: [{ key: 'items', label: 'Remote Links' }, countField],
};

export const commentOutputSchema: OutputSchema = { fields: commentFields };

export const commentPageOutputSchema: OutputSchema = {
	fields: [{ key: 'items', label: 'Comments', labelKey: 'id', listItems: commentFields }, ...pageMetaFields],
};

export const deleteCommentOutputSchema: OutputSchema = {
	fields: [
		...successFields,
		{ key: 'comment_id', label: 'Comment ID' },
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
	],
};

export const worklogOutputSchema: OutputSchema = { fields: worklogFields };

export const worklogPageOutputSchema: OutputSchema = {
	fields: [{ key: 'items', label: 'Worklogs', labelKey: 'timeSpent', listItems: worklogFields }, ...pageMetaFields],
};

export const deleteWorklogOutputSchema: OutputSchema = {
	fields: [
		...successFields,
		{ key: 'worklog_id', label: 'Worklog ID' },
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
	],
};

export const uploadAttachmentOutputSchema: OutputSchema = {
	fields: [{ key: 'items', label: 'Attachments', labelKey: 'filename', listItems: attachmentFields }, countField],
};

export const downloadAttachmentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Attachment ID' },
		{ key: 'filename', label: 'File Name' },
		{ key: 'mime_type', label: 'MIME Type' },
		{ key: 'size', label: 'Size', format: 'filesize' },
		{ key: 'created', label: 'Created', format: 'datetime' },
		{ key: 'author_account_id', label: 'Author Account ID' },
		{ key: 'author_display_name', label: 'Author' },
		{ key: 'file', label: 'File', format: 'url' },
	],
};

export const deleteAttachmentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'attachment_id', label: 'Attachment ID' },
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
	],
};

export const fieldsListOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Fields',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'Field ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'custom', label: 'Custom', format: 'boolean' },
				{ key: 'searchable', label: 'Searchable', format: 'boolean' },
				{ key: 'clauseNames', label: 'JQL Names' },
				{
					key: 'schema',
					label: 'Schema',
					children: [
						{ key: 'type', label: 'Type' },
						{ key: 'items', label: 'Item Type' },
						{ key: 'custom', label: 'Custom Type' },
					],
				},
			],
		},
		countField,
	],
};

export const issueTypeCreateFieldsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Fields',
			labelKey: 'name',
			listItems: [
				{ key: 'fieldId', label: 'Field ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'required', label: 'Required', format: 'boolean' },
				{ key: 'hasDefaultValue', label: 'Has Default', format: 'boolean' },
				{ key: 'schema', label: 'Schema', children: [{ key: 'type', label: 'Type' }, { key: 'items', label: 'Item Type' }] },
				{ key: 'allowedValues', label: 'Allowed Values' },
			],
		},
		...pageMetaFields,
	],
};

export const issueEditMetadataOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'fields',
			label: 'Editable Fields',
			dynamicKey: true,
			labelKey: 'name',
			children: [
				{ key: 'name', label: 'Name' },
				{ key: 'required', label: 'Required', format: 'boolean' },
				{ key: 'operations', label: 'Operations' },
				{ key: 'allowedValues', label: 'Allowed Values' },
			],
		},
	],
};

export const issueTransitionsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Transitions',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'Transition ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'to', label: 'Target Status', children: statusFields },
				{ key: 'hasScreen', label: 'Has Screen', format: 'boolean' },
				{ key: 'isAvailable', label: 'Available', format: 'boolean' },
				{ key: 'isConditional', label: 'Conditional', format: 'boolean' },
				{ key: 'fields', label: 'Screen Fields' },
			],
		},
		countField,
	],
};

export const issueTypesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'project_id', label: 'Project ID' },
		{ key: 'items', label: 'Issue Types', labelKey: 'name', listItems: issueTypeFields },
		countField,
	],
};

export const issueLinkTypesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Link Types',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'Link Type ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'inward', label: 'Inward Description' },
				{ key: 'outward', label: 'Outward Description' },
			],
		},
		countField,
	],
};

export const resolutionsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Resolutions',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'Resolution ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'description', label: 'Description' },
				{ key: 'isDefault', label: 'Default', format: 'boolean' },
			],
		},
		...pageMetaFields,
	],
};

export const statusesOutputSchema: OutputSchema = {
	fields: [{ key: 'items', label: 'Statuses', labelKey: 'name', listItems: statusFields }, countField],
};

export const prioritiesOutputSchema: OutputSchema = {
	fields: [{ key: 'items', label: 'Priorities', labelKey: 'name', listItems: priorityFields }, ...pageMetaFields],
};

export const projectPageOutputSchema: OutputSchema = {
	fields: [{ key: 'items', label: 'Projects', labelKey: 'name', listItems: projectFields }, ...pageMetaFields],
};

export const projectListOutputSchema: OutputSchema = {
	fields: [{ key: 'items', label: 'Projects', labelKey: 'name', listItems: projectFields }, countField],
};

export const projectOutputSchema: OutputSchema = {
	fields: [
		...projectFields,
		{ key: 'assigneeType', label: 'Default Assignee' },
		{ key: 'issueTypes', label: 'Issue Types', labelKey: 'name', listItems: issueTypeFields },
		{ key: 'versions', label: 'Versions', labelKey: 'name', listItems: versionFields },
		{ key: 'components', label: 'Components' },
	],
};

export const componentsOutputSchema: OutputSchema = {
	fields: [{ key: 'items', label: 'Components' }, ...pageMetaFields],
};

export const versionsOutputSchema: OutputSchema = {
	fields: [{ key: 'items', label: 'Versions', labelKey: 'name', listItems: versionFields }, ...pageMetaFields],
};

export const boardsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Boards',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'Board ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'type', label: 'Type' },
				{ key: 'isPrivate', label: 'Private', format: 'boolean' },
				{
					key: 'location',
					label: 'Location',
					children: [
						{ key: 'projectId', label: 'Project ID' },
						{ key: 'projectKey', label: 'Project Key' },
						{ key: 'projectName', label: 'Project Name' },
					],
				},
			],
		},
		...pageMetaFields,
	],
};

export const boardOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Board ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'type', label: 'Type' },
	],
};

export const sprintOutputSchema: OutputSchema = { fields: sprintFields };

export const sprintsOutputSchema: OutputSchema = {
	fields: [{ key: 'items', label: 'Sprints', labelKey: 'name', listItems: sprintFields }, ...pageMetaFields],
};

export const moveIssuesToSprintOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'sprint_id', label: 'Sprint ID' },
		{ key: 'issues', label: 'Moved Issues' },
		countField,
	],
};

export const currentUserOutputSchema: OutputSchema = {
	fields: [
		...userFields,
		{ key: 'locale', label: 'Locale' },
		{
			key: 'groups',
			label: 'Groups',
			children: [
				{ key: 'size', label: 'Group Count', format: 'number' },
				{
					key: 'items',
					label: 'Groups',
					labelKey: 'name',
					listItems: [
						{ key: 'name', label: 'Name' },
						{ key: 'groupId', label: 'Group ID' },
					],
				},
			],
		},
	],
};

export const usersOutputSchema: OutputSchema = {
	fields: [{ key: 'items', label: 'Users', labelKey: 'displayName', listItems: userFields }, countField],
};

export const userGroupsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Groups',
			labelKey: 'name',
			listItems: [
				{ key: 'name', label: 'Name' },
				{ key: 'groupId', label: 'Group ID' },
			],
		},
		countField,
	],
};

export const myPermissionsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Permissions',
			labelKey: 'key',
			listItems: [
				{ key: 'key', label: 'Permission Key' },
				{ key: 'name', label: 'Name' },
				{ key: 'type', label: 'Type' },
				{ key: 'havePermission', label: 'Granted', format: 'boolean' },
				{ key: 'description', label: 'Description' },
			],
		},
		countField,
	],
};

export const permittedProjectsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Projects',
			labelKey: 'key',
			listItems: [
				{ key: 'id', label: 'Project ID' },
				{ key: 'key', label: 'Project Key' },
			],
		},
		countField,
	],
};

export const filterOutputSchema: OutputSchema = {
	fields: [
		...filterFields,
		{ key: 'searchUrl', label: 'Search API URL', format: 'url' },
		{ key: 'favouritedCount', label: 'Favourited By', format: 'number' },
	],
};

export const filterPageOutputSchema: OutputSchema = {
	fields: [{ key: 'items', label: 'Filters', labelKey: 'name', listItems: filterFields }, ...pageMetaFields],
};

export const filterListOutputSchema: OutputSchema = {
	fields: [{ key: 'items', label: 'Filters', labelKey: 'name', listItems: filterFields }, countField],
};

export const dashboardsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Dashboards',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'Dashboard ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'view', label: 'View Path' },
				{ key: 'isFavourite', label: 'Favourite', format: 'boolean' },
			],
		},
		...pageMetaFields,
	],
};

export const jqlReferenceDataOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'fields',
			label: 'Fields',
			labelKey: 'displayName',
			listItems: [
				{ key: 'value', label: 'JQL Name' },
				{ key: 'displayName', label: 'Display Name' },
				{ key: 'cfid', label: 'Custom Field Reference' },
				{ key: 'operators', label: 'Operators' },
				{ key: 'types', label: 'Types' },
			],
		},
		{ key: 'field_count', label: 'Field Count', format: 'number' },
		{
			key: 'functions',
			label: 'Functions',
			labelKey: 'value',
			listItems: [
				{ key: 'value', label: 'Function' },
				{ key: 'displayName', label: 'Display Name' },
			],
		},
		{ key: 'reserved_words', label: 'Reserved Words' },
	],
};

export const jqlSuggestionsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Suggestions',
			labelKey: 'value',
			listItems: [
				{ key: 'value', label: 'Value' },
				{ key: 'displayName', label: 'Display Name', format: 'html' },
			],
		},
		countField,
	],
};

export const parseJqlOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Parsed Queries',
			labelKey: 'query',
			listItems: [
				{ key: 'query', label: 'Query' },
				{ key: 'errors', label: 'Errors' },
				{ key: 'warnings', label: 'Warnings' },
				{ key: 'structure', label: 'Structure' },
			],
		},
		countField,
	],
};

export const legacyAttachmentListOutputSchema: OutputSchema = {
	itemLabel: '{filename}',
	fields: [{ key: 'attachments', label: 'Attachments', value: '', listItems: attachmentFields }],
};

export const legacyGetAttachmentOutputSchema: OutputSchema = {
	fields: [...attachmentFields, { key: 'file', label: 'File', format: 'url' }],
};

export const legacyCommentPageOutputSchema: OutputSchema = {
	fields: [
		{ key: 'comments', label: 'Comments', labelKey: 'id', listItems: commentFields },
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'startAt', label: 'Start At', format: 'number' },
		{ key: 'maxResults', label: 'Max Results', format: 'number' },
	],
};

export const legacyFindUserOutputSchema: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', format: 'boolean' },
		{ key: 'data', label: 'Users', labelKey: 'displayName', listItems: userFields },
	],
};

export const legacyLinkIssuesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'message', label: 'Message' },
	],
};

export const legacyAddWatcherOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'error', label: 'Error' },
	],
};

export const legacyTransitionIssueOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'issue', label: 'Issue', children: issueFields },
	],
};

export const markdownToAdfOutputSchema: OutputSchema = {
	fields: [
		{ key: 'type', label: 'Document Type' },
		{ key: 'version', label: 'Version', format: 'number' },
		{ key: 'content', label: 'Content' },
	],
};

export const newCommentTriggerOutputSchema: OutputSchema = {
	fields: [
		{ key: 'issue', label: 'Issue', children: issueSummaryFields },
		{ key: 'comment', label: 'Comment', children: commentFields },
	],
};

export const newAttachmentTriggerOutputSchema: OutputSchema = {
	fields: [
		{ key: 'issue', label: 'Issue', children: issueSummaryFields },
		{ key: 'attachment', label: 'Attachment', children: attachmentFields },
		{ key: 'addedBy', label: 'Added By', children: userFields },
		{ key: 'addedAt', label: 'Added At', format: 'datetime' },
	],
};

export const issueAssignedTriggerOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'issue',
			label: 'Issue',
			children: [
				{ key: 'id', label: 'Issue ID' },
				{ key: 'key', label: 'Issue Key' },
				{ key: 'fields', label: 'Fields', children: issueFieldsFields },
			],
		},
		{
			key: 'change',
			label: 'Assignment',
			children: [
				{
					key: 'from',
					label: 'Previous Assignee',
					children: [
						{ key: 'accountId', label: 'Account ID' },
						{ key: 'displayName', label: 'Display Name' },
					],
				},
				{
					key: 'to',
					label: 'New Assignee',
					children: [
						{ key: 'accountId', label: 'Account ID' },
						{ key: 'displayName', label: 'Display Name' },
					],
				},
				{ key: 'by', label: 'Changed By', children: userFields },
				{ key: 'at', label: 'Changed At', format: 'datetime' },
			],
		},
	],
};

export const issueTypeTriggerOutputSchema: OutputSchema = { fields: issueTypeFields };

export const projectTriggerOutputSchema: OutputSchema = { fields: projectFields };

export const priorityTriggerOutputSchema: OutputSchema = { fields: priorityFields };
