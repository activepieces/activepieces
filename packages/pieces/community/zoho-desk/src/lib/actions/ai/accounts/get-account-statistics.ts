import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetAccountStatisticsOutputSchema } from '../../../output-schemas';

export const zohoDeskGetAccountStatisticsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_account_statistics',
	outputSchema: zohoDeskGetAccountStatisticsOutputSchema,
	displayName: 'Get Account Statistics',
	description: 'Gets ticket statistics for an account.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Gets one account's ticket statistics: open, closed and overdue counts, and response and satisfaction figures.",
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountId: zohoDeskAiProps.accountId({ required: true }),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
	},
	async run(context) {
		const { orgId, accountId, departmentId } = context.propsValue;
		return await zohoDeskApi.getAccountStatistics({
			auth: context.auth,
			orgId,
			accountId,
			departmentId,
		});
	},
});
