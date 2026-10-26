import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateContractOutputSchema } from '../../../output-schemas';

export const zohoDeskGetContractAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_contract',
	outputSchema: zohoDeskCreateContractOutputSchema,
	displayName: 'Get Contract',
	description: 'Gets a support contract by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one support contract by ID with its account, SLA, support plan, dates and status.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contractId: Property.ShortText({
			displayName: 'Contract ID',
			description: 'Contract ID (from List Contracts or List Account Contracts).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, contractId } = context.propsValue;
		return await zohoDeskApi.getContract({ auth: context.auth, orgId, contractId });
	},
});
