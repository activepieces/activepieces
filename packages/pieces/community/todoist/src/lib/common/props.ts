import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { todoistRestClient } from './client/rest-client';

const buildEmptyList = ({ placeholder }: { placeholder: string }) => {
	return {
		disabled: true,
		options: [],
		placeholder,
	};
};

export const todoistProjectIdDropdown = (description: string) =>
	Property.Dropdown<string>({
		displayName: 'Project',
		refreshers: [],
		description,
		required: false,
		options: async ({ auth }) => {
			if (!auth) {
				return buildEmptyList({
					placeholder: 'Please select an authentication',
				});
			}

			const token = (auth as OAuth2PropertyValue).access_token;
			const projects = await todoistRestClient.projects.list({ token });

			if (projects.length === 0) {
				return buildEmptyList({
					placeholder: 'No projects found! Please create a project.',
				});
			}

			const options = projects.map((p) => ({
				label: p.name,
				value: p.id,
			}));

			return {
				disabled: false,
				options,
			};
		},
	});

export const todoistSectionIdDropdown = Property.Dropdown({
	displayName: 'Section',
	refreshers: ['project_id'],
	required: false,
	options: async ({ auth, project_id }) => {
		if (!auth) {
			return buildEmptyList({
				placeholder: 'Please select an authentication',
			});
		}

		const token = (auth as OAuth2PropertyValue).access_token;
		const projectId = project_id as string | undefined;
		const sections = await todoistRestClient.sections.list({ token, project_id: projectId });

		if (sections.length === 0) {
			return buildEmptyList({
				placeholder: 'No sections found! Please create a section.',
			});
		}

		const options = sections.map((p) => ({
			label: p.name,
			value: p.id,
		}));

		return {
			disabled: false,
			options,
		};
	},
});
