import { OutputSchema } from '@activepieces/pieces-framework';

const rateFields: OutputSchema['fields'] = [
	{ key: 'amount', label: 'Amount (Cents)', format: 'number' },
	{ key: 'currency', label: 'Currency' },
];

const timeIntervalFields: OutputSchema['fields'] = [
	{ key: 'start', label: 'Start', format: 'datetime' },
	{ key: 'end', label: 'End', format: 'datetime' },
	{ key: 'duration', label: 'Duration', format: 'duration' },
	{ key: 'zonedStart', label: 'Zoned Start' },
	{ key: 'zonedEnd', label: 'Zoned End' },
	{ key: 'timeZone', label: 'Time Zone' },
];

const baseTimeEntryFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Time Entry ID' },
	{ key: 'description', label: 'Description' },
	{ key: 'userId', label: 'User ID' },
	{ key: 'workspaceId', label: 'Workspace ID' },
	{ key: 'projectId', label: 'Project ID' },
	{ key: 'taskId', label: 'Task ID' },
	{ key: 'tagIds', label: 'Tag IDs' },
	{ key: 'billable', label: 'Billable', format: 'boolean' },
	{ key: 'isLocked', label: 'Locked', format: 'boolean' },
	{ key: 'type', label: 'Type' },
	{ key: 'timeInterval', label: 'Time Interval', children: timeIntervalFields },
	{ key: 'customFieldValues', label: 'Custom Field Values' },
];

const timeEntryFields: OutputSchema['fields'] = [
	...baseTimeEntryFields,
	{ key: 'hourlyRate', label: 'Billable Rate', children: rateFields },
	{ key: 'costRate', label: 'Cost Rate', children: rateFields },
];

const projectSummaryFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Project ID' },
	{ key: 'name', label: 'Project Name' },
	{ key: 'clientId', label: 'Client ID' },
	{ key: 'clientName', label: 'Client Name' },
	{ key: 'color', label: 'Color' },
	{ key: 'billable', label: 'Billable', format: 'boolean' },
];

const userSummaryFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'User ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'email', label: 'Email', format: 'email' },
];

const hydratedTimeEntryFields: OutputSchema['fields'] = [
	...timeEntryFields,
	{ key: 'project', label: 'Project', children: projectSummaryFields },
	{
		key: 'task',
		label: 'Task',
		children: [
			{ key: 'id', label: 'Task ID' },
			{ key: 'name', label: 'Task Name' },
			{ key: 'status', label: 'Status' },
		],
	},
	{
		key: 'tags',
		label: 'Tags',
		labelKey: 'name',
		listItems: [
			{ key: 'id', label: 'Tag ID' },
			{ key: 'name', label: 'Name' },
		],
	},
	{ key: 'user', label: 'User', children: userSummaryFields },
];

const webhookTimeEntryFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Time Entry ID' },
	{ key: 'description', label: 'Description' },
	{ key: 'userId', label: 'User ID' },
	{ key: 'workspaceId', label: 'Workspace ID' },
	{ key: 'projectId', label: 'Project ID' },
	{ key: 'billable', label: 'Billable', format: 'boolean' },
	{ key: 'isLocked', label: 'Locked', format: 'boolean' },
	{ key: 'currentlyRunning', label: 'Currently Running', format: 'boolean' },
	{ key: 'type', label: 'Type' },
	{ key: 'timeInterval', label: 'Time Interval', children: timeIntervalFields },
	{ key: 'hourlyRate', label: 'Billable Rate (Cents)', format: 'number' },
	{ key: 'costRate', label: 'Cost Rate (Cents)', format: 'number' },
	{ key: 'project', label: 'Project', children: projectSummaryFields },
	{
		key: 'user',
		label: 'User',
		children: [
			{ key: 'id', label: 'User ID' },
			{ key: 'name', label: 'Name' },
			{ key: 'status', label: 'Status' },
		],
	},
	{ key: 'tags', label: 'Tags' },
];

const membershipFields: OutputSchema['fields'] = [
	{ key: 'userId', label: 'User ID' },
	{ key: 'targetId', label: 'Target ID' },
	{ key: 'membershipType', label: 'Membership Type' },
	{ key: 'membershipStatus', label: 'Membership Status' },
	{ key: 'hourlyRate', label: 'Billable Rate', children: rateFields },
	{ key: 'costRate', label: 'Cost Rate', children: rateFields },
];

const estimateFields: OutputSchema['fields'] = [
	{ key: 'estimate', label: 'Estimate' },
	{ key: 'type', label: 'Type' },
	{ key: 'resetOption', label: 'Reset Option' },
	{ key: 'active', label: 'Active', format: 'boolean' },
];

const projectFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Project ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'workspaceId', label: 'Workspace ID' },
	{ key: 'clientId', label: 'Client ID' },
	{ key: 'clientName', label: 'Client Name' },
	{ key: 'color', label: 'Color' },
	{ key: 'note', label: 'Note' },
	{ key: 'billable', label: 'Billable', format: 'boolean' },
	{ key: 'public', label: 'Public', format: 'boolean' },
	{ key: 'archived', label: 'Archived', format: 'boolean' },
	{ key: 'template', label: 'Template', format: 'boolean' },
	{ key: 'duration', label: 'Tracked Duration', format: 'duration' },
	{ key: 'hourlyRate', label: 'Billable Rate', children: rateFields },
	{ key: 'costRate', label: 'Cost Rate', children: rateFields },
	{ key: 'timeEstimate', label: 'Time Estimate', children: estimateFields },
	{ key: 'budgetEstimate', label: 'Budget Estimate', children: estimateFields },
	{
		key: 'memberships',
		label: 'Members',
		labelKey: 'userId',
		listItems: membershipFields,
	},
];

const taskFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Task ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'projectId', label: 'Project ID' },
	{ key: 'status', label: 'Status' },
	{ key: 'assigneeIds', label: 'Assignee IDs' },
	{ key: 'userGroupIds', label: 'User Group IDs' },
	{ key: 'estimate', label: 'Estimate', format: 'duration' },
	{ key: 'budgetEstimate', label: 'Budget Estimate (Cents)', format: 'number' },
	{ key: 'duration', label: 'Tracked Duration', format: 'duration' },
	{ key: 'billable', label: 'Billable', format: 'boolean' },
	{ key: 'hourlyRate', label: 'Billable Rate', children: rateFields },
	{ key: 'costRate', label: 'Cost Rate', children: rateFields },
];

const tagFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Tag ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'workspaceId', label: 'Workspace ID' },
	{ key: 'archived', label: 'Archived', format: 'boolean' },
];

const clientFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Client ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'email', label: 'Email', format: 'email' },
	{ key: 'address', label: 'Address' },
	{ key: 'note', label: 'Note' },
	{ key: 'archived', label: 'Archived', format: 'boolean' },
	{ key: 'workspaceId', label: 'Workspace ID' },
	{ key: 'currencyId', label: 'Currency ID' },
];

const clientWithCurrencyFields: OutputSchema['fields'] = [
	...clientFields,
	{ key: 'currencyCode', label: 'Currency' },
];

const userGroupFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'User Group ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'workspaceId', label: 'Workspace ID' },
	{ key: 'userIds', label: 'User IDs' },
	{ key: 'teamManagers', label: 'Team Managers' },
];

const userFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'User ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'email', label: 'Email', format: 'email' },
	{ key: 'status', label: 'Status' },
	{ key: 'profilePicture', label: 'Profile Picture', format: 'image' },
	{ key: 'activeWorkspace', label: 'Active Workspace ID' },
	{ key: 'defaultWorkspace', label: 'Default Workspace ID' },
	{
		key: 'settings',
		label: 'Settings',
		children: [
			{ key: 'timeZone', label: 'Time Zone' },
			{ key: 'weekStart', label: 'Week Start' },
			{ key: 'dateFormat', label: 'Date Format' },
			{ key: 'timeFormat', label: 'Time Format' },
			{ key: 'lang', label: 'Language' },
		],
	},
	{ key: 'memberships', label: 'Memberships' },
	{ key: 'customFields', label: 'Custom Fields' },
];

const workspaceFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Workspace ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'imageUrl', label: 'Image URL', format: 'image' },
	{ key: 'featureSubscriptionType', label: 'Plan' },
	{ key: 'cakeOrganizationId', label: 'Organization ID' },
	{ key: 'hourlyRate', label: 'Billable Rate', children: rateFields },
	{ key: 'costRate', label: 'Cost Rate', children: rateFields },
	{
		key: 'memberships',
		label: 'Members',
		labelKey: 'userId',
		listItems: membershipFields,
	},
	{ key: 'currencies', label: 'Currencies' },
	{
		key: 'subdomain',
		label: 'Subdomain',
		children: [
			{ key: 'name', label: 'Name' },
			{ key: 'enabled', label: 'Enabled', format: 'boolean' },
		],
	},
	{
		key: 'workspaceSettings',
		label: 'Settings',
		children: [
			{ key: 'timeTrackingMode', label: 'Time Tracking Mode' },
			{ key: 'activeBillableHours', label: 'Billable Hours On', format: 'boolean' },
			{ key: 'taskRateEnabled', label: 'Task Rates On', format: 'boolean' },
			{ key: 'timeApprovalEnabled', label: 'Time Approval On', format: 'boolean' },
			{ key: 'forceProjects', label: 'Project Required', format: 'boolean' },
			{ key: 'forceTasks', label: 'Task Required', format: 'boolean' },
			{ key: 'forceTags', label: 'Tag Required', format: 'boolean' },
			{ key: 'forceDescription', label: 'Description Required', format: 'boolean' },
			{ key: 'trackTimeDownToSecond', label: 'Track To The Second', format: 'boolean' },
			{ key: 'invoicingEnabled', label: 'Invoicing On', format: 'boolean' },
			{ key: 'expensesEnabled', label: 'Expenses On', format: 'boolean' },
			{ key: 'schedulingEnabled', label: 'Scheduling On', format: 'boolean' },
			{ key: 'kioskEnabled', label: 'Kiosk On', format: 'boolean' },
		],
	},
];

const holidayFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Holiday ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'workspaceId', label: 'Workspace ID' },
	{
		key: 'datePeriod',
		label: 'Date Period',
		children: [
			{ key: 'startDate', label: 'Start Date', format: 'date' },
			{ key: 'endDate', label: 'End Date', format: 'date' },
		],
	},
	{ key: 'occursAnnually', label: 'Occurs Annually', format: 'boolean' },
	{ key: 'everyoneIncludingNew', label: 'Everyone', format: 'boolean' },
	{ key: 'userIds', label: 'User IDs' },
	{ key: 'userGroupIds', label: 'User Group IDs' },
];

const templateFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Template ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'userId', label: 'User ID' },
	{ key: 'workspaceId', label: 'Workspace ID' },
	{ key: 'entries', label: 'Entries' },
];

const templateRowFields: OutputSchema['fields'] = [
	{ key: 'projectId', label: 'Project ID' },
	{ key: 'taskId', label: 'Task ID' },
];

const hydratedTemplateRowFields: OutputSchema['fields'] = [
	{ key: 'type', label: 'Type' },
	{ key: 'project', label: 'Project', children: projectSummaryFields },
	{ key: 'task', label: 'Task' },
];

const entityFilterFields: OutputSchema['fields'] = [
	{ key: 'ids', label: 'IDs' },
	{ key: 'contains', label: 'Contains' },
	{ key: 'status', label: 'Status' },
];

const sharedReportFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Shared Report ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'type', label: 'Type' },
	{ key: 'workspaceId', label: 'Workspace ID' },
	{ key: 'userId', label: 'Author ID' },
	{ key: 'isPublic', label: 'Public', format: 'boolean' },
	{ key: 'fixedDate', label: 'Fixed Date', format: 'boolean' },
	{ key: 'visibleToUsers', label: 'Visible To Users' },
	{ key: 'visibleToUserGroups', label: 'Visible To User Groups' },
	{
		key: 'filter',
		label: 'Filter',
		children: [
			{ key: 'dateRangeStart', label: 'From', format: 'datetime' },
			{ key: 'dateRangeEnd', label: 'To', format: 'datetime' },
			{ key: 'users', label: 'Users', children: entityFilterFields },
			{ key: 'projects', label: 'Projects', children: entityFilterFields },
			{ key: 'exportType', label: 'Export Type' },
			{ key: 'timeZone', label: 'Time Zone' },
		],
	},
];

const reportTotalFields: OutputSchema['fields'] = [
	{ key: 'totalTime', label: 'Total Time', format: 'duration' },
	{ key: 'totalBillableTime', label: 'Billable Time', format: 'duration' },
	{ key: 'entriesCount', label: 'Entries', format: 'number' },
	{ key: 'totalAmount', label: 'Total Amount (Cents)', format: 'number' },
	{ key: 'numOfCurrencies', label: 'Currencies', format: 'number' },
];

const reportGroupFields: OutputSchema['fields'] = [
	{ key: '_id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'duration', label: 'Duration', format: 'duration' },
	{ key: 'color', label: 'Color' },
	{ key: 'clientName', label: 'Client Name' },
	{ key: 'amounts', label: 'Amounts' },
];

const summaryReportFields: OutputSchema['fields'] = [
	{ key: 'totals', label: 'Totals', listItems: reportTotalFields },
	{
		key: 'groupOne',
		label: 'Groups',
		labelKey: 'name',
		listItems: reportGroupFields,
	},
];

const customFieldFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Custom Field ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'type', label: 'Type' },
	{ key: 'entityType', label: 'Applies To' },
	{ key: 'status', label: 'Status' },
	{ key: 'required', label: 'Required', format: 'boolean' },
	{ key: 'onlyAdminCanEdit', label: 'Only Admins Can Edit', format: 'boolean' },
	{ key: 'placeholder', label: 'Placeholder' },
	{ key: 'allowedValues', label: 'Allowed Values' },
	{ key: 'workspaceDefaultValue', label: 'Default Value' },
	{ key: 'workspaceId', label: 'Workspace ID' },
];

const detailedTimeEntryFields: OutputSchema['fields'] = [
	{ key: '_id', label: 'Time Entry ID' },
	{ key: 'description', label: 'Description' },
	{ key: 'userId', label: 'User ID' },
	{ key: 'userName', label: 'User Name' },
	{ key: 'userEmail', label: 'User Email', format: 'email' },
	{ key: 'projectId', label: 'Project ID' },
	{ key: 'projectName', label: 'Project Name' },
	{ key: 'clientId', label: 'Client ID' },
	{ key: 'clientName', label: 'Client Name' },
	{ key: 'taskId', label: 'Task ID' },
	{ key: 'taskName', label: 'Task Name' },
	{ key: 'billable', label: 'Billable', format: 'boolean' },
	{ key: 'isLocked', label: 'Locked', format: 'boolean' },
	{ key: 'approvalStatus', label: 'Approval Status' },
	{
		key: 'timeInterval',
		label: 'Time Interval',
		children: [
			{ key: 'start', label: 'Start', format: 'datetime' },
			{ key: 'end', label: 'End', format: 'datetime' },
			{ key: 'duration', label: 'Duration (Seconds)', format: 'number' },
		],
	},
	{
		key: 'tags',
		label: 'Tags',
		labelKey: 'name',
		listItems: [
			{ key: '_id', label: 'Tag ID' },
			{ key: 'name', label: 'Name' },
		],
	},
];

const totalsByDayFields: OutputSchema['fields'] = [
	{ key: 'date', label: 'Date', format: 'datetime' },
	{ key: 'duration', label: 'Duration (Seconds)', format: 'number' },
	{ key: 'amount', label: 'Amount (Cents)', format: 'number' },
];

const weeklyDayFields: OutputSchema['fields'] = [
	{ key: 'date', label: 'Date', format: 'datetime' },
	{ key: 'duration', label: 'Duration (Seconds)', format: 'number' },
];

const weeklyRowFields: OutputSchema['fields'] = [
	{ key: '_id', label: 'ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'duration', label: 'Duration (Seconds)', format: 'number' },
	{ key: 'amount', label: 'Amount (Cents)', format: 'number' },
	{
		key: 'days',
		label: 'Days',
		labelKey: 'date',
		listItems: weeklyDayFields,
	},
];

export const workspaceOutputSchema: OutputSchema = { fields: workspaceFields };

export const workspacesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'workspaces', label: 'Workspaces', labelKey: 'name', listItems: workspaceFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const currentUserOutputSchema: OutputSchema = { fields: userFields };

export const usersOutputSchema: OutputSchema = {
	fields: [
		{ key: 'users', label: 'Users', labelKey: 'name', listItems: userFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const managersOutputSchema: OutputSchema = {
	fields: [
		{ key: 'managers', label: 'Managers', labelKey: 'name', listItems: userFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const memberProfileOutputSchema: OutputSchema = {
	fields: [
		{ key: 'name', label: 'Name' },
		{ key: 'email', label: 'Email', format: 'email' },
		{ key: 'weekStart', label: 'Week Start' },
		{ key: 'workCapacity', label: 'Work Capacity', format: 'duration' },
		{ key: 'workingDays', label: 'Working Days' },
		{ key: 'imageUrl', label: 'Image URL', format: 'image' },
		{ key: 'hasPendingApprovalRequest', label: 'Pending Approval', format: 'boolean' },
		{ key: 'userCustomFieldValues', label: 'Custom Field Values' },
	],
};

export const userRolesOutputSchema: OutputSchema = {
	itemLabel: '{role.name}',
	fields: [
		{
			key: 'roles',
			label: 'Roles',
			value: '',
			listItems: [
				{ key: 'userId', label: 'User ID' },
				{ key: 'workspaceId', label: 'Workspace ID' },
				{
					key: 'role',
					label: 'Role',
					children: [
						{ key: 'id', label: 'Entity ID' },
						{ key: 'name', label: 'Name' },
					],
				},
			],
		},
	],
};

export const removedUserRoleOutputSchema: OutputSchema = {
	fields: [
		{ key: 'removed', label: 'Removed', format: 'boolean' },
		{ key: 'userId', label: 'User ID' },
		{ key: 'role', label: 'Role' },
		{ key: 'entityId', label: 'Entity ID' },
	],
};

export const userCustomFieldValueOutputSchema: OutputSchema = {
	fields: [
		{ key: 'customFieldId', label: 'Custom Field ID' },
		{ key: 'customFieldName', label: 'Custom Field Name' },
		{ key: 'customFieldType', label: 'Custom Field Type' },
		{ key: 'userId', label: 'User ID' },
		{ key: 'value', label: 'Value' },
	],
};

export const userGroupOutputSchema: OutputSchema = { fields: userGroupFields };

export const userGroupsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'userGroups', label: 'User Groups', labelKey: 'name', listItems: userGroupFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const clientOutputSchema: OutputSchema = { fields: clientWithCurrencyFields };

export const changedClientOutputSchema: OutputSchema = { fields: clientFields };

export const clientsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'clients', label: 'Clients', labelKey: 'name', listItems: clientWithCurrencyFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const projectOutputSchema: OutputSchema = { fields: projectFields };

export const projectsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'projects', label: 'Projects', labelKey: 'name', listItems: projectFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const taskOutputSchema: OutputSchema = { fields: taskFields };

export const tasksOutputSchema: OutputSchema = {
	fields: [
		{ key: 'tasks', label: 'Tasks', labelKey: 'name', listItems: taskFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const foundTasksOutputSchema: OutputSchema = {
	itemLabel: '{name}',
	fields: [{ key: 'tasks', label: 'Tasks', value: '', listItems: taskFields }],
};

export const newTaskOutputSchema: OutputSchema = {
	fields: [...taskFields, { key: 'workspaceId', label: 'Workspace ID' }],
};

export const tagOutputSchema: OutputSchema = { fields: tagFields };

export const tagsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'tags', label: 'Tags', labelKey: 'name', listItems: tagFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const timeEntryOutputSchema: OutputSchema = { fields: baseTimeEntryFields };

export const hydratedTimeEntryOutputSchema: OutputSchema = {
	fields: hydratedTimeEntryFields,
};

export const timeEntriesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'timeEntries',
			label: 'Time Entries',
			labelKey: 'description',
			listItems: timeEntryFields,
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const changedTimeEntriesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'timeEntries',
			label: 'Time Entries',
			labelKey: 'description',
			listItems: baseTimeEntryFields,
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const hydratedTimeEntriesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'timeEntries',
			label: 'Time Entries',
			labelKey: 'description',
			listItems: hydratedTimeEntryFields,
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const foundTimeEntriesOutputSchema: OutputSchema = {
	itemLabel: '{description}',
	fields: [
		{ key: 'timeEntries', label: 'Time Entries', value: '', listItems: hydratedTimeEntryFields },
	],
};

export const runningTimersOutputSchema: OutputSchema = {
	itemLabel: '{description}',
	fields: [{ key: 'timeEntries', label: 'Running Timers', value: '', listItems: timeEntryFields }],
};

export const webhookTimeEntryOutputSchema: OutputSchema = {
	fields: webhookTimeEntryFields,
};

export const deletedOutputSchema: OutputSchema = {
	fields: [
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
		{ key: 'id', label: 'ID' },
	],
};

export const invoicedOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'invoiced', label: 'Invoiced', format: 'boolean' },
		{ key: 'timeEntryIds', label: 'Time Entry IDs' },
	],
};

export const holidayOutputSchema: OutputSchema = { fields: holidayFields };

export const holidaysOutputSchema: OutputSchema = {
	fields: [
		{ key: 'holidays', label: 'Holidays', labelKey: 'name', listItems: holidayFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const templateOutputSchema: OutputSchema = {
	fields: [
		...templateFields,
		{ key: 'projectsAndTasks', label: 'Rows', listItems: templateRowFields },
	],
};

export const hydratedTemplateOutputSchema: OutputSchema = {
	fields: [
		...templateFields,
		{
			key: 'projectsAndTasks',
			label: 'Rows',
			listItems: [...templateRowFields, ...hydratedTemplateRowFields],
		},
	],
};

export const templatesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'templates',
			label: 'Templates',
			labelKey: 'name',
			listItems: [
				...templateFields,
				{
					key: 'projectsAndTasks',
					label: 'Rows',
					listItems: [...templateRowFields, ...hydratedTemplateRowFields],
				},
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const sharedReportOutputSchema: OutputSchema = { fields: sharedReportFields };

export const sharedReportsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'reports',
			label: 'Shared Reports',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'Shared Report ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'type', label: 'Type' },
				{ key: 'link', label: 'Link', format: 'url' },
				{ key: 'reportAuthor', label: 'Author' },
				{ key: 'isPublic', label: 'Public', format: 'boolean' },
				{ key: 'fixedDate', label: 'Fixed Date', format: 'boolean' },
				{ key: 'visibleToUsers', label: 'Visible To Users' },
				{ key: 'visibleToUserGroups', label: 'Visible To User Groups' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const sharedReportDataOutputSchema: OutputSchema = {
	fields: [
		{ key: 'totals', label: 'Totals', listItems: reportTotalFields },
		{
			key: 'groupOne',
			label: 'Groups',
			labelKey: 'name',
			listItems: [
				...reportGroupFields,
				{ key: 'amount', label: 'Amount (Cents)', format: 'number' },
				{ key: 'days', label: 'Days', labelKey: 'date', listItems: weeklyDayFields },
			],
		},
		{
			key: 'timeentries',
			label: 'Time Entries',
			labelKey: 'description',
			listItems: detailedTimeEntryFields,
		},
		{ key: 'totalsByDay', label: 'Totals By Day', labelKey: 'date', listItems: totalsByDayFields },
		{
			key: 'filters',
			label: 'Report',
			children: [
				{ key: 'id', label: 'Shared Report ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'type', label: 'Type' },
			],
		},
	],
};

export const detailedReportOutputSchema: OutputSchema = {
	fields: [
		{ key: 'totals', label: 'Totals', listItems: reportTotalFields },
		{
			key: 'timeentries',
			label: 'Time Entries',
			labelKey: 'description',
			listItems: detailedTimeEntryFields,
		},
	],
};

export const summaryReportOutputSchema: OutputSchema = { fields: summaryReportFields };

export const weeklyReportOutputSchema: OutputSchema = {
	fields: [
		{ key: 'totals', label: 'Totals', listItems: reportTotalFields },
		{
			key: 'totalsByDay',
			label: 'Totals By Day',
			labelKey: 'date',
			listItems: totalsByDayFields,
		},
		{
			key: 'groupOne',
			label: 'Rows',
			labelKey: 'name',
			listItems: weeklyRowFields,
		},
	],
};

export const attendanceReportOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'totals',
			label: 'Totals',
			children: [
				{ key: 'capacity', label: 'Capacity (Seconds)', format: 'number' },
				{ key: 'totalDuration', label: 'Tracked (Seconds)', format: 'number' },
				{ key: 'break', label: 'Break (Seconds)', format: 'number' },
				{ key: 'overtime', label: 'Overtime (Seconds)', format: 'number' },
				{ key: 'timeOff', label: 'Time Off (Seconds)', format: 'number' },
				{ key: 'entriesCount', label: 'Entries', format: 'number' },
			],
		},
		{
			key: 'entities',
			label: 'Days',
			labelKey: 'userName',
			listItems: [
				{ key: 'userId', label: 'User ID' },
				{ key: 'userName', label: 'User Name' },
				{ key: 'date', label: 'Date', format: 'datetime' },
				{ key: 'capacity', label: 'Capacity (Seconds)', format: 'number' },
				{ key: 'totalDuration', label: 'Tracked (Seconds)', format: 'number' },
				{ key: 'break', label: 'Break (Seconds)', format: 'number' },
				{ key: 'overtime', label: 'Overtime (Seconds)', format: 'number' },
				{ key: 'timeOff', label: 'Time Off (Seconds)', format: 'number' },
				{ key: 'hasRunningEntry', label: 'Timer Running', format: 'boolean' },
			],
		},
	],
};

export const expenseReportOutputSchema: OutputSchema = {
	fields: [
		{ key: 'totals', label: 'Totals' },
		{ key: 'expenses', label: 'Expenses' },
		{ key: 'exportFields', label: 'Export Fields' },
	],
};

export const customFieldsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'customFields', label: 'Custom Fields', labelKey: 'name', listItems: customFieldFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const projectCustomFieldsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'customFields', label: 'Custom Fields' },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const assignmentsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'assignments', label: 'Assignments' },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const createdEntitiesOutputSchema: OutputSchema = {
	itemLabel: '{documentCode} {id}',
	fields: [
		{
			key: 'entities',
			label: 'Records',
			value: '',
			listItems: [
				{ key: 'id', label: 'Record ID' },
				{ key: 'documentCode', label: 'Record Type' },
				{ key: 'workspaceId', label: 'Workspace ID' },
				{
					key: 'auditMetadata',
					label: 'Audit',
					children: [
						{ key: 'createdAt', label: 'Created At', format: 'datetime' },
						{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
					],
				},
			],
		},
	],
};
