import { DropdownOption, Property } from '@activepieces/pieces-framework';
import { tryCatch } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from './client';

export const ANALYTICS_PERIOD_OPTIONS = [
	{ label: 'Today', value: 'today' },
	{ label: 'Yesterday', value: 'yesterday' },
	{ label: 'Last 24 hours', value: '24h' },
	{ label: 'Last 7 days', value: '7d' },
	{ label: 'Last 30 days', value: '30d' },
	{ label: 'Last 3 months', value: '3m' },
	{ label: 'Last 6 months', value: '6m' },
	{ label: 'Last 12 months', value: '12m' },
	{ label: 'All time', value: 'all' },
];

export const formsDropdown = Property.Dropdown<string, true, typeof tallyAuth>({
	auth: tallyAuth,
	displayName: 'Form',
	required: true,
	refreshers: [],
	async options({ auth }) {
		if (!auth) {
			return {
				disabled: true,
				placeholder: 'Connect your account first',
				options: [],
			};
		}

		const { data: forms, error } = await tryCatch(() => tallyApiClient.listForms(auth.secret_text));

		if (error) {
			return {
				disabled: true,
				placeholder: 'Failed to load forms — check your connection',
				options: [],
			};
		}

		const options: DropdownOption<string>[] = forms.map((form) => ({
			label: form.name,
			value: form.id,
		}));

		return { disabled: false, placeholder: 'Select a form', options };
	},
});

export const workspacesDropdown = Property.Dropdown<string, true, typeof tallyAuth>({
	auth: tallyAuth,
	displayName: 'Workspace',
	required: true,
	refreshers: [],
	async options({ auth }) {
		if (!auth) {
			return {
				disabled: true,
				placeholder: 'Connect your account first',
				options: [],
			};
		}

		const { data, error } = await tryCatch(() => tallyApiClient.listWorkspaces({ apiKey: auth.secret_text }));

		if (error) {
			return {
				disabled: true,
				placeholder: 'Failed to load workspaces — check your connection',
				options: [],
			};
		}

		const options: DropdownOption<string>[] = data.items.map((workspace) => ({
			label: workspace.name ?? 'Untitled Workspace',
			value: workspace.id,
		}));

		return { disabled: false, placeholder: 'Select a workspace', options };
	},
});

export const optionalWorkspacesDropdown = Property.Dropdown<string, false, typeof tallyAuth>({
	auth: tallyAuth,
	displayName: 'Workspace',
	description: 'Defaults to your account\'s default workspace if left empty.',
	required: false,
	refreshers: [],
	async options({ auth }) {
		if (!auth) {
			return {
				disabled: true,
				placeholder: 'Connect your account first',
				options: [],
			};
		}

		const { data, error } = await tryCatch(() => tallyApiClient.listWorkspaces({ apiKey: auth.secret_text }));

		if (error) {
			return {
				disabled: true,
				placeholder: 'Failed to load workspaces — check your connection',
				options: [],
			};
		}

		const options: DropdownOption<string>[] = data.items.map((workspace) => ({
			label: workspace.name ?? 'Untitled Workspace',
			value: workspace.id,
		}));

		return { disabled: false, placeholder: 'Select a workspace', options };
	},
});

export const foldersDropdown = Property.Dropdown<string, false, typeof tallyAuth>({
	auth: tallyAuth,
	displayName: 'Folder',
	description: 'Only folders inside the selected workspace are shown.',
	required: false,
	refreshers: ['workspace_id'],
	async options({ auth, workspace_id }) {
		if (!auth) {
			return {
				disabled: true,
				placeholder: 'Connect your account first',
				options: [],
			};
		}

		if (typeof workspace_id !== 'string' || workspace_id.length === 0) {
			return {
				disabled: true,
				placeholder: 'Select a workspace first',
				options: [],
			};
		}

		const { data: folders, error } = await tryCatch(() =>
			tallyApiClient.listWorkspaceFolders({ apiKey: auth.secret_text, workspaceId: workspace_id }),
		);

		if (error) {
			return {
				disabled: true,
				placeholder: 'Failed to load folders — check your connection',
				options: [],
			};
		}

		const options: DropdownOption<string>[] = folders.map((folder) => ({
			label: folder.name,
			value: folder.id,
		}));

		return { disabled: false, placeholder: 'Select a folder', options };
	},
});

export const requiredFoldersDropdown = Property.Dropdown<string, true, typeof tallyAuth>({
	auth: tallyAuth,
	displayName: 'Folder',
	description: 'Only folders inside the selected workspace are shown.',
	required: true,
	refreshers: ['workspace_id'],
	async options({ auth, workspace_id }) {
		if (!auth) {
			return {
				disabled: true,
				placeholder: 'Connect your account first',
				options: [],
			};
		}

		if (typeof workspace_id !== 'string' || workspace_id.length === 0) {
			return {
				disabled: true,
				placeholder: 'Select a workspace first',
				options: [],
			};
		}

		const { data: folders, error } = await tryCatch(() =>
			tallyApiClient.listWorkspaceFolders({ apiKey: auth.secret_text, workspaceId: workspace_id }),
		);

		if (error) {
			return {
				disabled: true,
				placeholder: 'Failed to load folders — check your connection',
				options: [],
			};
		}

		const options: DropdownOption<string>[] = folders.map((folder) => ({
			label: folder.name,
			value: folder.id,
		}));

		return { disabled: false, placeholder: 'Select a folder', options };
	},
});
