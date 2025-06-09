import { HttpMethod } from '@activepieces/pieces-common';
import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { tickTickApiCall } from './client';

interface DropdownParams {
	displayName: string;
	description?: string;
	required: boolean;
}

export const projectId = (params: DropdownParams) =>
	Property.Dropdown({
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					placeholder: 'Please authenticate first',
					options: [],
				};
			}

			const authValue = auth as OAuth2PropertyValue;
			const response = await tickTickApiCall<{ id: string; name: string }[]>({
				accessToken: authValue.access_token,
				method: HttpMethod.GET,
				resourceUri: '/project',
			});

			const projects = [...(response || []), { id: 'inbox', name: 'inbox' }];

			return {
				disabled: false,
				options: projects.map((project) => {
					return {
						label: project.name,
						value: project.id,
					};
				}),
			};
		},
	});

export const taskId = (params: DropdownParams) =>
	Property.Dropdown({
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		refreshers: ['projectId'],
		options: async ({ auth, projectId }) => {
			if (!auth || !projectId) {
				return {
					disabled: true,
					placeholder: 'Please authenticate first and select list.',
					options: [],
				};
			}

			const authValue = auth as OAuth2PropertyValue;
			const response = await tickTickApiCall<{ tasks: { id: string; title: string }[] }>({
				accessToken: authValue.access_token,
				method: HttpMethod.GET,
				resourceUri: `/project/${projectId}/data`,
			});

			return {
				disabled: false,
				options: response.tasks.map((task) => {
					return {
						label: task.title,
						value: task.id,
					};
				}),
			};
		},
	});
