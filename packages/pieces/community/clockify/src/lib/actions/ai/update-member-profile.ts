import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { memberProfileOutputSchema } from '../../output-schemas';

const DAY_OPTIONS = [
	{ label: 'Monday', value: 'MONDAY' },
	{ label: 'Tuesday', value: 'TUESDAY' },
	{ label: 'Wednesday', value: 'WEDNESDAY' },
	{ label: 'Thursday', value: 'THURSDAY' },
	{ label: 'Friday', value: 'FRIDAY' },
	{ label: 'Saturday', value: 'SATURDAY' },
	{ label: 'Sunday', value: 'SUNDAY' },
];

export const updateMemberProfileAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_member_profile',
	outputSchema: memberProfileOutputSchema,
	displayName: 'Update Member Profile',
	description: "Updates a workspace member's profile.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Updates a workspace member's name, week start, daily work capacity or working days. Only the fields you set change. Needs workspace admin (or the member themself). Returns the updated profile.",
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		userId: clockifyAiProps.userId({ required: true }),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		weekStart: Property.StaticDropdown({
			displayName: 'Week Start',
			required: false,
			options: { disabled: false, options: DAY_OPTIONS },
		}),
		workCapacity: Property.ShortText({
			displayName: 'Work Capacity',
			description: 'Daily work capacity as an ISO 8601 duration, for example PT8H.',
			required: false,
		}),
		workingDays: Property.StaticMultiSelectDropdown({
			displayName: 'Working Days',
			description: 'Replaces the member working days.',
			required: false,
			options: { disabled: false, options: DAY_OPTIONS },
		}),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.updateMemberProfile({
			auth,
			workspaceId: propsValue.workspaceId,
			userId: propsValue.userId,
			changes: {
				name: propsValue.name,
				weekStart: propsValue.weekStart,
				workCapacity: propsValue.workCapacity,
				workingDays: propsValue.workingDays,
			},
		});
	},
});
