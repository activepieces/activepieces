import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetAccountStatisticsOutputSchema } from '../../../output-schemas';

export const zohoDeskGetContactStatisticsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_contact_statistics',
	outputSchema: zohoDeskGetAccountStatisticsOutputSchema,
	displayName: 'Get Contact Statistics',
	description: 'Gets ticket statistics for a contact.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Gets one contact's ticket statistics: open, closed and overdue counts, and response and satisfaction figures.",
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
	},
	async run(context) {
		const { orgId, contactId, departmentId } = context.propsValue;
		return await zohoDeskApi.getContactStatistics({
			auth: context.auth,
			orgId,
			contactId,
			departmentId,
		});
	},
});
