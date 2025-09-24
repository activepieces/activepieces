import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createMilestone = createAction({
	name: 'create_milestone',
	displayName: 'Create Milestone',
	description: 'Add a milestone with due date, description, responsible user, etc.',
	auth: teamworkAuth,
	props: {
		projectId: Property.Dropdown({
			displayName: 'Project',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please authenticate first.',
						options: [],
					};
				}
				const res = await teamworkRequest(auth as OAuth2PropertyValue, {
					method: HttpMethod.GET,
					path: '/projects.json',
				});
				const options = res.data.projects.map((p: { id: string; name: string }) => ({
					label: p.name,
					value: p.id,
				}));
				return {
					disabled: false,
					options,
				};
			},
		}),
		title: Property.ShortText({
			displayName: 'Title',
			required: true,
		}),
		deadline: Property.DateTime({
			displayName: 'Deadline',
			required: true,
		}),
		'responsible-party-ids': Property.MultiSelectDropdown({
			displayName: 'Responsible Parties',
			required: true,
			refreshers: ['projectId'],
			options: async ({ auth, projectId }) => {
				if (!auth || !projectId) {
					return {
						disabled: true,
						placeholder: 'Please select a project.',
						options: [],
					};
				}
				const res = await teamworkRequest(auth as OAuth2PropertyValue, {
					method: HttpMethod.GET,
					path: `/projects/${projectId}/people.json`,
				});
				const options = res.data.people.map((p: { id: string; 'first-name': string; 'last-name': string }) => ({
					label: `${p['first-name']} ${p['last-name']}`,
					value: p.id,
				}));
				return {
					disabled: false,
					options,
				};
			},
		}),
		description: Property.LongText({
			displayName: 'Description',
			required: false,
		}),
		notify: Property.Checkbox({
			displayName: 'Notify',
			required: false,
		}),
		private: Property.Checkbox({
			displayName: 'Private',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const deadline = new Date(propsValue.deadline)
			.toISOString()
			.slice(0, 10)
			.replace(/-/g, '');
		const body = {
			milestone: {
				title: propsValue.title,
				deadline: deadline,
				'responsible-party-ids': propsValue['responsible-party-ids'].join(','),
				description: propsValue.description,
				notify: propsValue.notify,
				private: propsValue.private,
			},
		};
		return await teamworkRequest(auth, {
			method: HttpMethod.POST,
			path: `/projects/${propsValue.projectId}/milestones.json`,
			body,
		});
	},
});


