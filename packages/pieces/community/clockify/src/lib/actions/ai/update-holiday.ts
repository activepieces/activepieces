import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { holidayOutputSchema } from '../../output-schemas';

export const updateHolidayAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_holiday',
	outputSchema: holidayOutputSchema,
	displayName: 'Update Holiday',
	description: 'Changes a holiday.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes a holiday name, dates, who it applies to or whether it repeats yearly. Only the fields you set change: the action reads the holiday and sends the rest back. User and group lists you set replace the current ones. Needs workspace admin and a Clockify plan with time off (Standard or higher).',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		holidayId: clockifyAiProps.holidayId({ required: true }),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		startDate: Property.ShortText({
			displayName: 'Start Date',
			description: 'First day, YYYY-MM-DD.',
			required: false,
		}),
		endDate: Property.ShortText({
			displayName: 'End Date',
			description: 'Last day, YYYY-MM-DD. Same as Start Date for one day.',
			required: false,
		}),
		userIds: clockifyAiProps.idList({
			required: false,
			displayName: 'User IDs',
			description: 'Replaces the users it applies to. Use List Users. Empty = unchanged.',
		}),
		userGroupIds: clockifyAiProps.idList({
			required: false,
			displayName: 'User Group IDs',
			description:
				'Replaces the user groups it applies to. Use List User Groups. Empty = unchanged.',
		}),
		everyone: Property.StaticDropdown({
			displayName: 'Everyone',
			description: 'Applies to all members (Yes) or only the listed ones (No). Empty = unchanged.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Yes', value: 'true' },
					{ label: 'No', value: 'false' },
				],
			},
		}),
		occursAnnually: Property.StaticDropdown({
			displayName: 'Repeats Yearly',
			description: 'Empty = unchanged.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Yes', value: 'true' },
					{ label: 'No', value: 'false' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const holidays = await clockifyApi.listHolidays({
			auth,
			workspaceId: propsValue.workspaceId,
			query: {},
		});
		const current = holidays.find((holiday) => holiday.id === propsValue.holidayId);
		if (!current) {
			throw new Error(
				`Holiday ${propsValue.holidayId} not found in this workspace. Use List Holidays to find it.`,
			);
		}
		return await clockifyApi.updateHoliday({
			auth,
			workspaceId: propsValue.workspaceId,
			holidayId: propsValue.holidayId,
			holiday: {
				name: propsValue.name ?? current.name,
				datePeriod: {
					startDate: propsValue.startDate ?? current.datePeriod.startDate,
					endDate: propsValue.endDate ?? current.datePeriod.endDate,
				},
				occursAnnually:
					clockifyUtils.toOptionalBoolean({ value: propsValue.occursAnnually }) ??
					current.occursAnnually ??
					false,
				everyoneIncludingNew:
					clockifyUtils.toOptionalBoolean({ value: propsValue.everyone }) ??
					current.everyoneIncludingNew ??
					false,
				users: clockifyUtils.entityFilter({
					ids: clockifyUtils.nonEmptyIds({ values: propsValue.userIds }) ?? current.userIds,
				}),
				userGroups: clockifyUtils.entityFilter({
					ids:
						clockifyUtils.nonEmptyIds({ values: propsValue.userGroupIds }) ?? current.userGroupIds,
				}),
				automaticTimeEntryCreation:
					typeof current.automaticTimeEntryCreation === 'object'
						? current.automaticTimeEntryCreation
						: undefined,
			},
		});
	},
});
