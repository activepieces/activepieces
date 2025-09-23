import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createExpense = createAction({
	name: 'create_expense',
	displayName: 'Create Expense',
	description: 'Create an expense entry',
	auth: teamworkAuth,
	props: {
		projectId: Property.ShortText({ displayName: 'Project ID', required: true }),
		amount: Property.Number({ displayName: 'Amount', required: true }),
		currency: Property.ShortText({ displayName: 'Currency (e.g. USD)', required: true }),
		date: Property.ShortText({ displayName: 'Date (YYYYMMDD)', required: true }),
		description: Property.LongText({ displayName: 'Description', required: false }),
	},
	async run({ auth, propsValue }) {
		const body = { expense: { projectId: propsValue.projectId, amount: propsValue.amount, currency: propsValue.currency, date: propsValue.date, description: propsValue.description } };
		return await teamworkRequest(auth, { method: HttpMethod.POST, path: `/expenses.json`, body });
	},
});


