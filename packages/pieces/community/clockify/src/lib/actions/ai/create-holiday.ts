import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { holidayOutputSchema } from '../../output-schemas';

export const createHolidayAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_create_holiday',
	outputSchema: holidayOutputSchema,
	displayName: 'Create Holiday',
	description: 'Adds a holiday to a workspace.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds a holiday (one day or a date range) for everyone or for chosen users and groups, optionally repeating every year. Needs workspace admin and a Clockify plan with time off (Standard or higher). Not idempotent.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		name: Property.ShortText({ displayName: 'Name', required: true }),
		startDate: Property.ShortText({
			displayName: 'Start Date',
			description: 'First day, YYYY-MM-DD.',
			required: true,
		}),
		endDate: Property.ShortText({
			displayName: 'End Date',
			description: 'Last day, YYYY-MM-DD. Same as Start Date for one day.',
			required: true,
		}),
		userIds: clockifyAiProps.idList({
			required: false,
			displayName: 'User IDs',
			description: 'Users it applies to. Use List Users.',
		}),
		userGroupIds: clockifyAiProps.idList({
			required: false,
			displayName: 'User Group IDs',
			description: 'User groups it applies to. Use List User Groups.',
		}),
		everyone: Property.Checkbox({
			displayName: 'Everyone',
			description:
				'Applies to all current and future members; User IDs and User Group IDs are then ignored. Default true.',
			required: false,
			defaultValue: true,
		}),
		occursAnnually: Property.Checkbox({
			displayName: 'Repeats Yearly',
			description: 'Default false.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.createHoliday({
			auth,
			workspaceId: propsValue.workspaceId,
			holiday: {
				name: propsValue.name,
				datePeriod: { startDate: propsValue.startDate, endDate: propsValue.endDate },
				occursAnnually: propsValue.occursAnnually ?? false,
				everyoneIncludingNew: propsValue.everyone ?? true,
				users: clockifyUtils.entityFilter({ ids: propsValue.userIds }),
				userGroups: clockifyUtils.entityFilter({ ids: propsValue.userGroupIds }),
			},
		});
	},
});
