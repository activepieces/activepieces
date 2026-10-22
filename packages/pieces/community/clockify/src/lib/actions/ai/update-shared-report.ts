import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { sharedReportOutputSchema } from '../../output-schemas';

import type { ClockifyAuthValue, ClockifySharedReportListItem } from '../../common/types';

const YES_NO = [
	{ label: 'Yes', value: 'true' },
	{ label: 'No', value: 'false' },
];

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
		isPublic: Property.StaticDropdown({
			displayName: 'Public',
			description: 'Anyone with the link can view it. Empty = unchanged.',
			required: false,
			options: { disabled: false, options: YES_NO },
		}),
		fixedDate: Property.StaticDropdown({
			displayName: 'Fixed Period',
			description: 'Viewers cannot change the period. Empty = unchanged.',
			required: false,
			options: { disabled: false, options: YES_NO },
		}),
		visibleToUsers: clockifyAiProps.idList({
			required: false,
			displayName: 'Visible to Users',
			description: 'User IDs that can view it; replaces the list. Empty = unchanged.',
		}),
		visibleToUserGroups: clockifyAiProps.idList({
			required: false,
			displayName: 'Visible to User Groups',
			description: 'User group IDs that can view it; replaces the list. Empty = unchanged.',
		}),
	},
	async run({ auth, propsValue }) {
		const current = await findSharedReport({
			auth,
			workspaceId: propsValue.workspaceId,
			sharedReportId: propsValue.sharedReportId,
			page: 1,
		});
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
				isPublic:
					clockifyUtils.toOptionalBoolean({ value: propsValue.isPublic }) ?? current.isPublic,
				fixedDate:
					clockifyUtils.toOptionalBoolean({ value: propsValue.fixedDate }) ?? current.fixedDate,
				visibleToUsers:
					clockifyUtils.nonEmptyIds({ values: propsValue.visibleToUsers }) ??
					current.visibleToUsers?.map((user) => user.id),
				visibleToUserGroups:
					clockifyUtils.nonEmptyIds({ values: propsValue.visibleToUserGroups }) ??
					current.visibleToUserGroups?.map((group) => group.id),
			},
		});
	},
});

async function findSharedReport({
	auth,
	workspaceId,
	sharedReportId,
	page,
}: {
	auth: ClockifyAuthValue;
	workspaceId: string;
	sharedReportId: string;
	page: number;
}): Promise<ClockifySharedReportListItem | undefined> {
	const result = await clockifyApi.listSharedReports({
		auth,
		workspaceId,
		query: {
			sharedReportsFilter: 'ALL',
			page: String(page),
			pageSize: String(SHARED_REPORTS_PAGE_SIZE),
		},
	});
	const reports = result.reports ?? [];
	const match = reports.find((report) => report.id === sharedReportId);
	if (match || reports.length < SHARED_REPORTS_PAGE_SIZE) {
		return match;
	}
	return await findSharedReport({ auth, workspaceId, sharedReportId, page: page + 1 });
}

const SHARED_REPORTS_PAGE_SIZE = 1000;
