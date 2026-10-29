import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCountAccountsOutputSchema } from '../../../output-schemas';

export const zohoDeskCountContractsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_count_contracts',
	outputSchema: zohoDeskCountAccountsOutputSchema,
	displayName: 'Count Contracts',
	description: 'Counts the contracts in a view.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Returns the number of contracts in one contract view and department.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		viewId: Property.ShortText({
			displayName: 'View ID',
			description: 'Contract view ID (from List Views, module contracts).',
			required: true,
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: true }),
		ownerId: Property.ShortText({
			displayName: 'Owner ID',
			description: 'Only contracts owned by this agent.',
			required: false,
		}),
	},
	async run(context) {
		const { orgId, viewId, departmentId, ownerId } = context.propsValue;
		return await zohoDeskApi.countContracts({
			auth: context.auth,
			orgId,
			viewId,
			departmentId,
			ownerId,
		});
	},
});
