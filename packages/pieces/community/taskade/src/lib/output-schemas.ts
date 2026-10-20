import { OutputSchema } from '@activepieces/pieces-framework';

type Fields = OutputSchema['fields'];

const idName: Fields = [
	{ key: 'id', label: 'ID' },
	{ key: 'name', label: 'Name' },
];

const projectFields: Fields = [
	{ key: 'id', label: 'Project ID', description: 'Use this ID in other Taskade steps.' },
	{ key: 'name', label: 'Name' },
	{ key: 'icon', label: 'Icon Emoji' },
	{ key: 'completed', label: 'Completed (Archived)', format: 'boolean' },
	{ key: 'url', label: 'Project Link', format: 'url' },
];

const taskFields: Fields = [
	{ key: 'id', label: 'Task ID', description: 'Use this ID in other Taskade task steps.' },
	{ key: 'text', label: 'Text' },
	{ key: 'parentId', label: 'Parent Task ID', description: 'Empty for the project root node.' },
	{ key: 'completed', label: 'Completed', format: 'boolean' },
	{ key: 'isRoot', label: 'Is Project Root', format: 'boolean', description: 'True for the project title node, which is not a real task.' },
];

const rawTaskFields: Fields = [
	{ key: 'id', label: 'Task ID' },
	{ key: 'text', label: 'Text' },
	{ key: 'parentId', label: 'Parent Task ID' },
	{ key: 'completed', label: 'Completed', format: 'boolean' },
];

const memberFields: Fields = [
	{ key: 'handle', label: 'Handle', description: 'Pass this to Assign Task.' },
	{ key: 'displayName', label: 'Display Name' },
];

const dateFields: Fields = [
	{ key: 'date', label: 'Date', format: 'date' },
	{ key: 'time', label: 'Time' },
	{ key: 'timezone', label: 'Timezone' },
];

const agentFields: Fields = [
	{ key: 'id', label: 'Agent ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'spaceId', label: 'Workspace ID' },
	{ key: 'description', label: 'Description (System Prompt)' },
	{ key: 'knowledgeEnabled', label: 'Knowledge Enabled', format: 'boolean' },
	{
		key: 'commands',
		label: 'Commands',
		labelKey: 'name',
		listItems: [
			{ key: 'id', label: 'Command ID' },
			{ key: 'name', label: 'Command Name' },
			{ key: 'prompt', label: 'Command Prompt' },
		],
	},
];

const conversationFields: Fields = [
	{ key: 'id', label: 'Conversation ID' },
	{ key: 'agentId', label: 'Agent ID' },
	{ key: 'title', label: 'Title' },
	{ key: 'status', label: 'Status', description: 'in_progress, idle or requires_review.' },
];

const pageFields: Fields = [
	{ key: 'page', label: 'Page', format: 'number' },
	{ key: 'nextPage', label: 'Next Page', format: 'number', description: 'Pass this as Page to get the next page. Empty when there are no more.' },
	{ key: 'hasMore', label: 'Has More', format: 'boolean' },
];

function list({ label, itemLabel, items, extra = [] }: { label: string; itemLabel?: string; items: Fields; extra?: Fields }): OutputSchema {
	return {
		fields: [{ key: 'items', label, labelKey: itemLabel, listItems: items }, ...extra],
	};
}

export const taskadeOutputSchemas: Record<string, OutputSchema> = {
	legacyCreateTask: {
		fields: [
			{ key: 'ok', label: 'OK', format: 'boolean' },
			{
				key: 'item',
				label: 'Created Tasks',
				listItems: [
					{ key: 'id', label: 'Task ID' },
					{ key: 'completed', label: 'Completed', format: 'boolean' },
				],
			},
		],
	},
	legacyTaskItem: {
		fields: [
			{ key: 'ok', label: 'OK', format: 'boolean' },
			{ key: 'item', label: 'Task', children: rawTaskFields },
		],
	},
	legacyDelete: {
		fields: [
			{ key: 'ok', label: 'Deleted', format: 'boolean' },
			{ key: 'alreadyDeleted', label: 'Was Already Deleted', format: 'boolean', description: 'True when the task did not exist any more, so nothing was changed.' },
		],
	},
	listWorkspaces: list({ label: 'Workspaces', itemLabel: 'name', items: idName }),
	listFolders: list({ label: 'Folders', itemLabel: 'name', items: idName }),
	listProjects: list({ label: 'Projects', itemLabel: 'name', items: projectFields }),
	listRecentProjects: list({ label: 'Projects', itemLabel: 'name', items: projectFields, extra: pageFields }),
	project: { fields: projectFields },
	listProjectTemplates: list({ label: 'Templates', itemLabel: 'name', items: idName, extra: pageFields }),
	listProjectMembers: list({ label: 'Members', itemLabel: 'displayName', items: memberFields, extra: pageFields }),
	listProjectFields: list({
		label: 'Custom Fields',
		itemLabel: 'displayName',
		items: [
			{ key: 'id', label: 'Field ID', description: 'Pass this to Set Custom Field Value.' },
			{ key: 'type', label: 'Type' },
			{ key: 'displayName', label: 'Name' },
			{ key: 'options', label: 'Options', labelKey: 'name', listItems: idName },
			{ key: 'data', label: 'Raw Field Settings' },
		],
	}),
	shareLink: {
		fields: [
			{ key: 'projectId', label: 'Project ID' },
			{ key: 'enabled', label: 'Share Link Enabled', format: 'boolean' },
			{ key: 'viewUrl', label: 'View Link', format: 'url' },
			{ key: 'editUrl', label: 'Edit Link', format: 'url' },
			{ key: 'checkUrl', label: 'Check-only Link', format: 'url' },
		],
	},
	listTasks: list({
		label: 'Tasks',
		itemLabel: 'text',
		items: taskFields,
		extra: [
			{ key: 'nextCursor', label: 'Next Cursor', description: 'Pass this as Cursor to get the next page. Empty when there are no more.' },
			{ key: 'hasMore', label: 'Has More', format: 'boolean' },
		],
	}),
	findTasks: list({
		label: 'Matching Tasks',
		itemLabel: 'text',
		items: taskFields,
		extra: [
			{ key: 'found', label: 'Found', format: 'boolean' },
			{ key: 'scanned', label: 'Tasks Scanned', format: 'number' },
			{ key: 'truncated', label: 'Scan Truncated', format: 'boolean', description: 'True when the project has more tasks than the scan limit; pass nextCursor as Start Cursor to keep searching.' },
			{ key: 'nextCursor', label: 'Next Cursor' },
		],
	}),
	task: { fields: taskFields },
	taskDetails: {
		fields: [
			...taskFields,
			{
				key: 'date',
				label: 'Date',
				description: 'Empty when the task has no date.',
				children: [
					{ key: 'start', label: 'Start', children: dateFields },
					{ key: 'end', label: 'End', children: dateFields },
				],
			},
			{
				key: 'note',
				label: 'Note',
				description: 'Empty when the task has no note.',
				children: [
					{ key: 'type', label: 'Note Format' },
					{ key: 'value', label: 'Note Text' },
				],
			},
			{ key: 'assignees', label: 'Assignees', labelKey: 'displayName', listItems: memberFields },
			{
				key: 'fields',
				label: 'Custom Field Values',
				labelKey: 'fieldId',
				listItems: [
					{ key: 'fieldId', label: 'Field ID' },
					{ key: 'value', label: 'Value' },
				],
			},
		],
	},
	createTasks: list({
		label: 'Created Tasks',
		itemLabel: 'text',
		items: [
			{ key: 'id', label: 'Task ID', description: 'Use this ID in other Taskade task steps.' },
			{ key: 'text', label: 'Text', description: 'The text that was sent.' },
			{ key: 'completed', label: 'Completed', format: 'boolean' },
		],
		extra: [{ key: 'count', label: 'Created Count', format: 'number' }],
	}),
	deleteTask: {
		fields: [
			{ key: 'projectId', label: 'Project ID' },
			{ key: 'taskId', label: 'Task ID' },
			{ key: 'deleted', label: 'Deleted', format: 'boolean' },
			{ key: 'alreadyDeleted', label: 'Was Already Deleted', format: 'boolean', description: 'True when the task did not exist any more, so nothing was changed.' },
		],
	},
	taskDate: {
		fields: [
			{ key: 'projectId', label: 'Project ID' },
			{ key: 'taskId', label: 'Task ID' },
			{ key: 'cleared', label: 'Date Cleared', format: 'boolean' },
			{
				key: 'date',
				label: 'Date',
				description: 'Empty when the date was cleared.',
				children: [
					{ key: 'start', label: 'Start', children: dateFields },
					{ key: 'end', label: 'End', children: dateFields },
				],
			},
		],
	},
	taskNote: {
		fields: [
			{ key: 'projectId', label: 'Project ID' },
			{ key: 'taskId', label: 'Task ID' },
			{ key: 'cleared', label: 'Note Cleared', format: 'boolean' },
			{
				key: 'note',
				label: 'Note',
				description: 'Empty when the note was cleared.',
				children: [
					{ key: 'type', label: 'Note Format' },
					{ key: 'value', label: 'Note Text' },
				],
			},
		],
	},
	assignTask: {
		fields: [...taskFields, { key: 'assignees', label: 'Assignees', labelKey: 'displayName', listItems: memberFields }],
	},
	unassignTask: {
		fields: [
			...taskFields,
			{ key: 'removedHandle', label: 'Removed Handle' },
			{ key: 'wasAssigned', label: 'Was Assigned', format: 'boolean', description: 'False when the person was not assigned, so nothing changed.' },
		],
	},
	taskFieldValue: {
		fields: [
			{ key: 'projectId', label: 'Project ID' },
			{ key: 'taskId', label: 'Task ID' },
			{ key: 'fieldId', label: 'Field ID' },
			{ key: 'value', label: 'Value', description: 'The value sent to Taskade. Empty when cleared.' },
			{ key: 'cleared', label: 'Value Cleared', format: 'boolean' },
		],
	},
	listAgents: list({ label: 'Agents', itemLabel: 'name', items: agentFields, extra: pageFields }),
	agent: { fields: agentFields },
	askAgent: {
		fields: [
			{ key: 'agentId', label: 'Agent ID' },
			{ key: 'spaceId', label: 'Workspace ID' },
			{ key: 'response', label: 'Agent Response', description: 'What the agent answered.' },
		],
	},
	listConversations: list({ label: 'Conversations', itemLabel: 'title', items: conversationFields, extra: pageFields }),
	conversation: {
		fields: [
			...conversationFields,
			{ key: 'transcript', label: 'Transcript', description: 'The conversation as text. Empty when not requested.' },
			{ key: 'truncated', label: 'Transcript Truncated', format: 'boolean' },
		],
	},
	deleteAgent: {
		fields: [
			{ key: 'agentId', label: 'Agent ID' },
			{ key: 'deleted', label: 'Deleted', format: 'boolean' },
			{ key: 'alreadyDeleted', label: 'Was Already Deleted', format: 'boolean' },
		],
	},
	agentKnowledge: {
		fields: [
			{ key: 'agentId', label: 'Agent ID' },
			{ key: 'projectId', label: 'Project ID' },
			{ key: 'linked', label: 'Project Is In Knowledge', format: 'boolean' },
		],
	},
	triggerAutomation: {
		fields: [
			{ key: 'status', label: 'HTTP Status', format: 'number' },
			{ key: 'ok', label: 'Accepted', format: 'boolean' },
		],
	},
	taskDueTrigger: {
		fields: [
			{ key: 'id', label: 'Task ID' },
			{ key: 'text', label: 'Task Text' },
			{ key: 'isCompleted', label: 'Completed', format: 'boolean' },
			{ key: 'projectName', label: 'Project Name' },
			{ key: 'projectID', label: 'Project ID' },
			{ key: 'spaceName', label: 'Workspace Name' },
			{ key: 'spaceID', label: 'Workspace ID' },
			{ key: 'assignees', label: 'Assignees' },
			{ key: 'taskStartDate', label: 'Start Date', format: 'date' },
			{ key: 'taskStartTime', label: 'Start Time' },
			{ key: 'taskStartTimezone', label: 'Start Timezone' },
			{ key: 'taskEndDate', label: 'End Date', format: 'date' },
			{ key: 'taskEndTime', label: 'End Time' },
			{ key: 'taskEndTimezone', label: 'End Timezone' },
		],
	},
	taskAssignedTrigger: {
		fields: [
			{ key: 'projectName', label: 'Project Name' },
			{ key: 'projectId', label: 'Project ID' },
			{ key: 'assignerName', label: 'Assigned By' },
			{
				key: 'nodes',
				label: 'Assigned Tasks',
				labelKey: 'nodeText',
				listItems: [
					{ key: 'nodeId', label: 'Task ID' },
					{ key: 'nodeText', label: 'Task Text' },
					{ key: 'isCompleted', label: 'Completed', format: 'boolean' },
					{ key: 'assignees', label: 'Assignee Handles' },
				],
			},
		],
	},
	commentCreatedTrigger: {
		fields: [
			{ key: 'projectName', label: 'Project Name' },
			{ key: 'projectId', label: 'Project ID' },
			{ key: 'nodeId', label: 'Task ID' },
			{ key: 'nodeText', label: 'Task Text' },
			{ key: 'commenterDisplayName', label: 'Commenter Name' },
			{ key: 'commenterHandle', label: 'Commenter Handle' },
			{ key: 'commentBody', label: 'Comment' },
			{ key: 'commentBodyType', label: 'Comment Format' },
			{ key: 'assignees', label: 'Task Assignees' },
			{ key: 'mentionedHandles', label: 'Mentioned Handles' },
		],
	},
	projectCreatedTrigger: {
		fields: [
			{ key: 'projectName', label: 'Project Name' },
			{ key: 'projectId', label: 'Project ID' },
			{ key: 'spaceName', label: 'Workspace Name' },
			{ key: 'spaceId', label: 'Workspace ID' },
			{ key: 'creatorName', label: 'Created By' },
		],
	},
	projectAssignedTrigger: {
		fields: [
			{ key: 'projectName', label: 'Project Name' },
			{ key: 'projectId', label: 'Project ID' },
			{ key: 'spaceName', label: 'Workspace Name' },
			{ key: 'spaceId', label: 'Workspace ID' },
			{ key: 'assignerName', label: 'Assigned By' },
			{ key: 'assigneeName', label: 'Assignee Name' },
			{ key: 'assigneeId', label: 'Assignee User ID' },
		],
	},
	projectJoinedTrigger: {
		fields: [
			{ key: 'projectName', label: 'Project Name' },
			{ key: 'projectId', label: 'Project ID' },
			{ key: 'spaceId', label: 'Workspace ID' },
			{ key: 'joinerName', label: 'Member Name' },
			{ key: 'joinerUserId', label: 'Member User ID' },
		],
	},
};
