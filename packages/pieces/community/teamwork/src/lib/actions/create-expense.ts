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
			required: true,
		}),
		cost: Property.Number({
			displayName: 'Cost',
			required: true,
		}),
		date: Property.DateTime({
			displayName: 'Date',
			required: true,
		}),
		description: Property.LongText({
			displayName: 'Description',
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


