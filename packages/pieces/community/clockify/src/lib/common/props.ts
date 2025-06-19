import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { clockifyApiCall } from './client';

interface DropdownParams {
	displayName: string;
	description?: string;
	required: boolean;
}

export const workspaceId = (params: DropdownParams) =>
	Property.Dropdown({
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect your account first.',
				};
			}

			const response = await clockifyApiCall<{ id: string; name: string }[]>({
				apiKey: auth as string,
				method: HttpMethod.GET,
				resourceUri: '/workspaces',
			});

			return {
				disabled: false,
				options: response.map((workspace) => ({
					label: workspace.name,
					value: workspace.id,
				})),
			};
		},
	});

export const projectId = (params: DropdownParams) =>
	Property.Dropdown({
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		refreshers: ['workspaceId'],
		options: async ({ auth, workspaceId }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect your account first.',
				};
			}

			if (!workspaceId) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please select workspace first.',
				};
			}

			const response = await clockifyApiCall<{ id: string; name: string }[]>({
				apiKey: auth as string,
				method: HttpMethod.GET,
				resourceUri: `/workspaces/${workspaceId}/projects`,
			});

			return {
				disabled: false,
				options: response.map((project) => ({
					label: project.name,
					value: project.id,
				})),
			};
		},
	});

export const assigneeIds = (params: DropdownParams) =>
	Property.MultiSelectDropdown({
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		refreshers: ['workspaceId'],
		options: async ({ auth, workspaceId }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect your account first.',
				};
			}

			if (!workspaceId) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please select workspace first.',
				};
			}

			const response = await clockifyApiCall<{ id: string; email: string }[]>({
				apiKey: auth as string,
				method: HttpMethod.GET,
				resourceUri: `/workspaces/${workspaceId}/users`,
			});

			return {
				disabled: false,
				options: response.map((user) => ({
					label: user.email,
					value: user.id,
				})),
			};
		},
	});

export const taskId = (params: DropdownParams) =>
	Property.Dropdown({
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		refreshers: ['workspaceId', 'projectId'],
		options: async ({ auth, workspaceId, projectId }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect your account first.',
				};
			}

			if (!workspaceId) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please select workspace first.',
				};
			}

			if (!projectId) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please select project first.',
				};
			}

			const response = await clockifyApiCall<{ id: string; name: string }[]>({
				apiKey: auth as string,
				method: HttpMethod.GET,
				resourceUri: `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
			});

			return {
				disabled: false,
				options: response.map((task) => ({
					label: task.name,
					value: task.id,
				})),
			};
		},
	});

export const tagIds = (params: DropdownParams) =>
	Property.MultiSelectDropdown({
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		refreshers: ['workspaceId'],
		options: async ({ auth, workspaceId }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect your account first.',
				};
			}

			if (!workspaceId) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please select workspace first.',
				};
			}
			const response = await clockifyApiCall<{ id: string; name: string }[]>({
				apiKey: auth as string,
				method: HttpMethod.GET,
				resourceUri: `/workspaces/${workspaceId}/tags`,
			});

			return {
				disabled: false,
				options: response.map((tag) => ({
					label: tag.name,
					value: tag.id,
				})),
			};
		},
	});
