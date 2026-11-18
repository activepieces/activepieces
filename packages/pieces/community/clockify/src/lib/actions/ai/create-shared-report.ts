import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { sharedReportOutputSchema } from '../../output-schemas';

export const createSharedReportAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_create_shared_report',
	outputSchema: sharedReportOutputSchema,
	displayName: 'Create Shared Report',
	description: 'Saves a detailed, summary or weekly report as a shareable link.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Saves a detailed, summary or weekly report for a period (optionally filtered by project or user) as a shared report, and returns it with its ID. Share it publicly or with chosen users. Not idempotent.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		name: Property.ShortText({ displayName: 'Name', required: true }),
		type: Property.StaticDropdown({
			displayName: 'Type',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Detailed', value: 'DETAILED' },
					{ label: 'Summary', value: 'SUMMARY' },
					{ label: 'Weekly', value: 'WEEKLY' },
				],
			},
		}),
		dateRangeStart: clockifyAiProps.dateRangeStart({ required: true }),
		dateRangeEnd: clockifyAiProps.dateRangeEnd({ required: true }),
		projectIds: clockifyAiProps.idList({
			required: false,
			displayName: 'Project IDs',
			description: 'Optional: only these projects.',
		}),
		userIds: clockifyAiProps.idList({
			required: false,
			displayName: 'User IDs',
			description: 'Optional: only these users.',
		}),
		isPublic: Property.Checkbox({
			displayName: 'Public',
			description: 'Anyone with the link can view it. Default false.',
			required: false,
		}),
		fixedDate: Property.Checkbox({
			displayName: 'Fixed Period',
			description: 'Viewers cannot change the period. Default false.',
			required: false,
		}),
		visibleToUsers: clockifyAiProps.idList({
			required: false,
			displayName: 'Visible to Users',
			description: 'User IDs that can view it.',
		}),
		visibleToUserGroups: clockifyAiProps.idList({
			required: false,
			displayName: 'Visible to User Groups',
			description: 'User group IDs that can view it.',
		}),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.createSharedReport({
			auth,
			workspaceId: propsValue.workspaceId,
			sharedReport: {
				name: propsValue.name,
				type: propsValue.type,
				isPublic: propsValue.isPublic,
				fixedDate: propsValue.fixedDate,
				visibleToUsers: propsValue.visibleToUsers?.map(String),
				visibleToUserGroups: propsValue.visibleToUserGroups?.map(String),
				filter: {
					dateRangeStart: propsValue.dateRangeStart,
					dateRangeEnd: propsValue.dateRangeEnd,
					exportType: 'JSON',
					projects: clockifyUtils.entityFilter({ ids: propsValue.projectIds }),
					users: clockifyUtils.entityFilter({ ids: propsValue.userIds }),
					detailedFilter:
						propsValue.type === 'DETAILED'
							? { page: 1, pageSize: 50, sortColumn: 'DATE' }
							: undefined,
					summaryFilter: propsValue.type === 'SUMMARY' ? { groups: ['PROJECT'] } : undefined,
					weeklyFilter:
						propsValue.type === 'WEEKLY' ? { group: 'PROJECT', subgroup: 'TIME' } : undefined,
				},
			},
		});
	},
});
