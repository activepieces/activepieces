import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { holidayOutputSchema } from '../../output-schemas';

export const deleteHolidayAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_delete_holiday',
	outputSchema: holidayOutputSchema,
	displayName: 'Delete Holiday',
	description: 'Deletes a holiday.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a holiday from the workspace. Needs workspace admin and a Clockify plan with time off (Standard or higher).',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		holidayId: clockifyAiProps.holidayId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.deleteHoliday({
			auth,
			workspaceId: propsValue.workspaceId,
			holidayId: propsValue.holidayId,
		});
	},
});
