import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { holidaysOutputSchema } from '../../output-schemas';

export const listHolidaysInPeriodAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_list_holidays_in_period',
	outputSchema: holidaysOutputSchema,
	displayName: 'List Holidays in Period',
	description: 'Lists the holidays of a user between two dates.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the holidays that fall between two dates for one user (default: the connected user), including yearly repeats. Use it to check days off before planning or logging time.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		assignedTo: clockifyAiProps.userId({
			required: false,
			displayName: 'User ID',
			description: 'User whose holidays to return. Empty = the connected user.',
		}),
		start: Property.DateTime({
			displayName: 'From',
			description: 'Start of the period, ISO 8601.',
			required: true,
		}),
		end: Property.DateTime({
			displayName: 'To',
			description: 'End of the period, ISO 8601.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const assignedTo = propsValue.assignedTo ?? (await clockifyApi.getCurrentUser({ auth })).id;
		const holidays = await clockifyApi.listHolidaysInPeriod({
			auth,
			workspaceId: propsValue.workspaceId,
			query: { 'assigned-to': assignedTo, start: propsValue.start, end: propsValue.end },
		});
		return { holidays, count: holidays.length };
	},
});
