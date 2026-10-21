import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { sharedReportOutputSchema } from '../../output-schemas';

export const updateSharedReportAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_shared_report',
	outputSchema: sharedReportOutputSchema,
	displayName: 'Update Shared Report',
	description: 'Renames a shared report or changes who can see it.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes a shared report name, public flag, fixed period or the users and groups it is visible to. Only the fields you set change: the action reads the report and sends the rest back. Its filters and type cannot be changed.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		sharedReportId: clockifyAiProps.sharedReportId({ required: true }),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		isPublic: Property.Checkbox({
			displayName: 'Public',
			description: 'Anyone with the link can view it; replaces the list. Empty = unchanged.',
			required: false,
		}),
		fixedDate: Property.Checkbox({
			displayName: 'Fixed Period',
			description: 'Viewers cannot change the period. Empty = unchanged.',
			required: false,
		}),
		visibleToUsers: clockifyAiProps.idList({
			required: false,
			displayName: 'Visible to Users',
			description: 'User IDs that can view it; replaces the list.',
		}),
		visibleToUserGroups: clockifyAiProps.idList({
			required: false,
			displayName: 'Visible to User Groups',
			description: 'User group IDs that can view it; replaces the list.',
		}),
	},
	async run({ auth, propsValue }) {
		const page = await clockifyApi.listSharedReports({
			auth,
			workspaceId: propsValue.workspaceId,
			query: { sharedReportsFilter: 'ALL', page: '1', pageSize: '1000' },
		});
		const current = page.reports?.find((report) => report.id === propsValue.sharedReportId);
		if (!current) {
			throw new Error(
				`Shared report ${propsValue.sharedReportId} not found in this workspace. Use List Shared Reports to find it.`,
			);
		}
		return await clockifyApi.updateSharedReport({
			auth,
			workspaceId: propsValue.workspaceId,
			sharedReportId: propsValue.sharedReportId,
			sharedReport: {
				name: propsValue.name ?? current.name,
				isPublic: propsValue.isPublic ?? current.isPublic,
				fixedDate: propsValue.fixedDate ?? current.fixedDate,
				visibleToUsers: propsValue.visibleToUsers?.map(String) ?? current.visibleToUsers,
				visibleToUserGroups:
					propsValue.visibleToUserGroups?.map(String) ?? current.visibleToUserGroups,
			},
		});
	},
});
