import { Property } from '@activepieces/pieces-framework';

function projectId({ displayName = 'Project ID', description }: { displayName?: string; description?: string } = {}) {
	return Property.ShortText({
		displayName,
		description:
			description ??
			'The project ID, or the project link (https://www.taskade.com/d/<project id>). Get it from List Projects or List My Recent Projects.',
		required: true,
	});
}

function taskId({ displayName = 'Task ID', description, required = true }: { displayName?: string; description?: string; required?: boolean } = {}) {
	return Property.ShortText({
		displayName,
		description: description ?? 'The task ID. Get it from List Tasks or Find Tasks.',
		required,
	});
}

function folderId({ description }: { description?: string } = {}) {
	return Property.ShortText({
		displayName: 'Workspace or Folder ID',
		description:
			description ??
			'A workspace ID or folder ID. A workspace ID works for its home folder. Get IDs from List Workspaces and List Folders.',
		required: true,
	});
}

function agentId() {
	return Property.ShortText({
		displayName: 'Agent ID',
		description: 'The AI agent ID. Get it from List AI Agents.',
		required: true,
	});
}

function limit({ max, defaultValue }: { max: number; defaultValue: number }) {
	return Property.Number({
		displayName: 'Limit',
		description: `How many items to return (1-${max}, default ${defaultValue}).`,
		required: false,
		defaultValue,
	});
}

function page() {
	return Property.Number({
		displayName: 'Page',
		description: 'Page number, starting at 1. Pass nextPage from the previous result to get more.',
		required: false,
		defaultValue: 1,
	});
}

function format() {
	return Property.StaticDropdown({
		displayName: 'Text Format',
		required: false,
		defaultValue: 'text/markdown',
		options: {
			disabled: false,
			options: [
				{ label: 'Markdown', value: 'text/markdown' },
				{ label: 'Plain text', value: 'text/plain' },
			],
		},
	});
}

export const taskadeAiProps = { projectId, taskId, folderId, agentId, limit, page, format };
