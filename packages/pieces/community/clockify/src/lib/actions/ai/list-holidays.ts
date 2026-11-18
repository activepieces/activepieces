import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { holidaysOutputSchema } from '../../output-schemas';

export const listHolidaysAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_list_holidays',
	outputSchema: holidaysOutputSchema,
	displayName: 'List Holidays',
	description: 'Lists the holidays of a workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the holidays set up in a workspace with their dates, who they apply to and whether they repeat yearly. Optionally only holidays assigned to one user. Use it to find a holiday ID.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		assignedTo: clockifyAiProps.userId({
			required: false,
			displayName: 'Assigned To',
			description: 'Optional: only holidays that apply to this user ID.',
		}),
	},
	async run({ auth, propsValue }) {
		const holidays = await clockifyApi.listHolidays({
			auth,
			workspaceId: propsValue.workspaceId,
			query: clockifyUtils.toQuery({ params: { 'assigned-to': propsValue.assignedTo } }),
		});
		return { holidays, count: holidays.length };
	},
});
