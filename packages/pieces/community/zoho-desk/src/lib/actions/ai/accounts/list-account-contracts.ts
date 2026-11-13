import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountContractsOutputSchema } from '../../../output-schemas';

export const zohoDeskListAccountContractsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_account_contracts',
	outputSchema: zohoDeskListAccountContractsOutputSchema,
	displayName: 'List Account Contracts',
	description: 'Lists the support contracts of an account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the support contracts of one account, optionally only active, expired or future ones.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountId: zohoDeskAiProps.accountId({ required: true }),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
		contractStatus: Property.StaticDropdown({
			displayName: 'Contract Status',
			description: 'Only contracts with this status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'ACTIVE', value: 'ACTIVE' },
					{ label: 'EXPIRED', value: 'EXPIRED' },
					{ label: 'FUTURE', value: 'FUTURE' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, accountId, departmentId, contractStatus, from, limit } = context.propsValue;
		const contracts = await zohoDeskApi.listAccountContracts({
			auth: context.auth,
			orgId,
			accountId,
			departmentId,
			contractStatus,
			from,
			limit,
		});
		return { contracts, count: contracts.length };
	},
});
