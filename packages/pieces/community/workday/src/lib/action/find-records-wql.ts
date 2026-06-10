import {
	OAuth2PropertyValue,
	Property,
	createAction,
} from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdayWqlRequest } from '../common';

export const findRecordsWql = createAction({
	auth: workdayAuth,
	name: 'find_records_wql',
	displayName: 'Find Records (WQL)',
	description:
		'Executes a Workday Query Language (WQL) query and returns the results.',
	props: {
		query: Property.LongText({
			displayName: 'WQL Query',
			description:
				'The Workday Query Language (WQL) query to execute (e.g., "SELECT workdayID, fullName FROM allWorkers").',
			required: true,
		}),
	},
	async run(ctx) {
		const response = await workdayWqlRequest(
			ctx.auth as OAuth2PropertyValue,
			ctx.propsValue.query,
		);
		return response.body;
	},
});
