import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createExpense = createAction({
	name: 'create_expense',
	displayName: 'Create Expense',
	description: 'Log new expense in a project with cost, description, date.',
	auth: teamworkAuth,
	props: {
		'project-id': Property.Dropdown({
			displayName: 'Project',
			description: 'The project to log the expense against.',
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
					path: '/projects/api/v3/projects.json',
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
		name: Property.ShortText({
			displayName: 'Name',
			description: 'The name of the expense.',
			required: true,
		}),
		cost: Property.Number({
			displayName: 'Cost',
			description: 'The cost of the expense.',
			required: true,
		}),
		date: Property.DateTime({
			displayName: 'Date',
			description: 'The date of the expense.',
			required: true,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'A description for the expense.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const date = new Date(propsValue.date).toISOString().slice(0, 10).replace(/-/g, '');
		const body = {
			expense: {
				'project-id': propsValue['project-id'],
				name: propsValue.name,
				cost: String(propsValue.cost),
				date: date,
				description: propsValue.description,
			},
		};
		return await teamworkRequest(auth, {
			method: HttpMethod.POST,
			path: `/expenses.json`,
			body,
		});
	},
});


