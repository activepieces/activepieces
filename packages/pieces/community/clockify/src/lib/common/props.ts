import { DropdownState, Property } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../auth';
import { clockifyApi } from './api';

function workspaceId<R extends boolean>({
	required,
	displayName = 'Workspace',
	description,
}: PropParams<R>) {
	return Property.Dropdown({
		auth: clockifyAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({
					placeholder: 'Please connect your account first.',
				});
			}

			const workspaces = await clockifyApi.listWorkspaces({ auth });

			return {
				disabled: false,
				options: workspaces.map((workspace) => ({
					label: workspace.name,
					value: workspace.id,
				})),
			};
		},
	});
}

function projectId<R extends boolean>({
	required,
	displayName = 'Project',
	description,
}: PropParams<R>) {
	return Property.Dropdown({
		auth: clockifyAuth,
		displayName,
		description,
		required,
		refreshers: ['workspaceId'],
		options: async ({ auth, workspaceId }) => {
			if (!auth) {
				return disabledOptions({
					placeholder: 'Please connect your account first.',
				});
			}

			if (!workspaceId) {
				return disabledOptions({
					placeholder: 'Please select workspace first.',
				});
			}

			const projects = await clockifyApi.listProjects({
				auth,
				workspaceId: String(workspaceId),
			});

			return {
				disabled: false,
				options: projects.map((project) => ({
					label: project.name,
					value: project.id,
				})),
			};
		},
	});
}

function assigneeIds<R extends boolean>({
	required,
	displayName = 'Assignee',
	description,
}: PropParams<R>) {
	return Property.MultiSelectDropdown({
		auth: clockifyAuth,
		displayName,
		description,
		required,
		refreshers: ['workspaceId'],
		options: async ({ auth, workspaceId }) => {
			if (!auth) {
				return disabledOptions({
					placeholder: 'Please connect your account first.',
				});
			}

			if (!workspaceId) {
				return disabledOptions({
					placeholder: 'Please select workspace first.',
				});
			}

			const users = await clockifyApi.listUsers({
				auth,
				workspaceId: String(workspaceId),
			});

			return {
				disabled: false,
				options: users.map((user) => ({
					label: user.email,
					value: user.id,
				})),
			};
		},
	});
}

function taskId<R extends boolean>({ required, displayName = 'Task', description }: PropParams<R>) {
	return Property.Dropdown({
		auth: clockifyAuth,
		displayName,
		description,
		required,
		refreshers: ['workspaceId', 'projectId'],
		options: async ({ auth, workspaceId, projectId }) => {
			if (!auth) {
				return disabledOptions({
					placeholder: 'Please connect your account first.',
				});
			}

			if (!workspaceId) {
				return disabledOptions({
					placeholder: 'Please select workspace first.',
				});
			}

			if (!projectId) {
				return disabledOptions({ placeholder: 'Please select project first.' });
			}

			const tasks = await clockifyApi.listTasks({
				auth,
				workspaceId: String(workspaceId),
				projectId: String(projectId),
			});

			return {
				disabled: false,
				options: tasks.map((task) => ({
					label: task.name,
					value: task.id,
				})),
			};
		},
	});
}

function tagIds<R extends boolean>({ required, displayName = 'Tags', description }: PropParams<R>) {
	return Property.MultiSelectDropdown({
		auth: clockifyAuth,
		displayName,
		description,
		required,
		refreshers: ['workspaceId'],
		options: async ({ auth, workspaceId }) => {
			if (!auth) {
				return disabledOptions({
					placeholder: 'Please connect your account first.',
				});
			}

			if (!workspaceId) {
				return disabledOptions({
					placeholder: 'Please select workspace first.',
				});
			}

			const tags = await clockifyApi.listTags({
				auth,
				workspaceId: String(workspaceId),
			});

			return {
				disabled: false,
				options: tags.map((tag) => ({
					label: tag.name,
					value: tag.id,
				})),
			};
		},
	});
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
	return { disabled: true, options: [], placeholder };
}

export const clockifyProps = {
	workspaceId,
	projectId,
	assigneeIds,
	taskId,
	tagIds,
};

export type PropParams<R extends boolean> = {
	required: R;
	displayName?: string;
	description?: string;
};
