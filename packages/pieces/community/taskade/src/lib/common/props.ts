import { DropdownOption, Property } from '@activepieces/pieces-framework';
import { TaskadeAPIClient } from './client';

const createEmptyOptions = (placeholder: string) => {
	return {
		disabled: true,
		options: [],
		placeholder,
	};
};

export const taskadeProps = {
	workspace_id: Property.Dropdown({
		displayName: 'Workspace',
		refreshers: [],
		required: true,
		options: async ({ auth }) => {
			if (!auth) {
				return createEmptyOptions('Please connect account first.');
			}

			const client = new TaskadeAPIClient(auth as string);
			const response = await client.listWorkspaces();

			const options: DropdownOption<string>[] = [];

			for (const workspace of response.items) {
				options.push({ label: workspace.name, value: workspace.id });
			}

			return {
				disabled: false,
				options,
			};
		},
	}),
	folder_id: Property.Dropdown({
		displayName: 'Folder',
		refreshers: ['workspace_id'],
		required: false,
		options: async ({ auth, workspace_id }) => {
			if (!auth) {
				return createEmptyOptions('Please connect account first.');
			}
			if (!workspace_id) {
				return createEmptyOptions('Please select workspace.');
			}

			const client = new TaskadeAPIClient(auth as string);
			const response = await client.listWorkspaceFolders(workspace_id as string);

			const options: DropdownOption<string>[] = [];

			for (const folder of response.items) {
				options.push({ label: folder.name, value: folder.id });
			}

			return {
				disabled: false,
				options,
			};
		},
	}),
	project_id: Property.Dropdown({
		displayName: 'Project',
		refreshers: ['workspace_id', 'folder_id'],
		required: true,
		options: async ({ auth, workspace_id, folder_id }) => {
			if (!auth) {
				return createEmptyOptions('Please connect account first.');
			}
			if (!workspace_id) {
				return createEmptyOptions('Please select workspace.');
			}

			const workspaceId = workspace_id as string;
			const folderId = (folder_id as string) ?? workspaceId;

			const client = new TaskadeAPIClient(auth as string);
			const response = await client.listProjects(folderId as string);

			const options: DropdownOption<string>[] = [];

			for (const project of response.items) {
				options.push({ label: project.name, value: project.id });
			}

			return {
				disabled: false,
				options,
			};
		},
	}),
	task_id: Property.Dropdown({
		displayName: 'Task',
		refreshers: ['project_id'],
		required: true,
		options: async ({ auth, project_id }) => {
			if (!auth) {
				return createEmptyOptions('Please connect account first.');
			}
			if (!project_id) {
				return createEmptyOptions('Please select project.');
			}

			const client = new TaskadeAPIClient(auth as string);
			const options: DropdownOption<string>[] = [];

			let after;
			let moreTasks = true;
			while (moreTasks) {
				const response = await client.listTasks(project_id as string, { limit: 100, after });
				if (response.items.length === 0) {
					moreTasks = false;
				} else {
					after = response.items[response.items.length - 1].id;
					for (const task of response.items) {
						options.push({ label: task.text, value: task.id });
					}
				}
			}
			return {
				disabled: false,
				options,
			};
		},
	}),
};
