import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUpdateContractOutputSchema } from '../../../output-schemas';

export const zohoDeskUpdateContractAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_update_contract',
	outputSchema: zohoDeskUpdateContractOutputSchema,
	displayName: 'Update Contract',
	description: 'Updates fields on a support contract.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates only the fields you set on one contract; fields left empty are not changed.',
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
		contractName: Property.ShortText({
			displayName: 'Contract Name',
			description: 'Contract name.',
			required: false,
		}),
		accountId: zohoDeskAiProps.accountId({ required: false }),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
		ownerId: Property.ShortText({
			displayName: 'Owner ID',
			description: 'Agent ID who owns the contract (from List Agents).',
			required: false,
		}),
		associatedSupportPlanId: Property.ShortText({
			displayName: 'Support Plan ID',
			description: 'Support plan the contract covers (from List Support Plans).',
			required: false,
		}),
		startDate: Property.ShortText({
			displayName: 'Start Date',
			description: 'Start date, YYYY-MM-DD.',
			required: false,
		}),
		endDate: Property.ShortText({
			displayName: 'End Date',
			description: 'End date, YYYY-MM-DD.',
			required: false,
		}),
		associatedSLAId: Property.ShortText({
			displayName: 'SLA ID',
			description: 'SLA policy for the contract (from List Account SLAs).',
			required: false,
		}),
		productId: zohoDeskAiProps.productId({ required: false }),
		contractNumber: Property.ShortText({
			displayName: 'Contract Number',
			description: 'Your contract number.',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'Contract notes.',
			required: false,
		}),
		customFields: Property.Object({
			displayName: 'Custom Fields',
			description: 'Custom field values keyed by API name (from List Fields, module contracts).',
			required: false,
		}),
	},
	async run(context) {
		const {
			orgId,
			contractId,
			contractName,
			accountId,
			departmentId,
			ownerId,
			associatedSupportPlanId,
			startDate,
			endDate,
			associatedSLAId,
			productId,
			contractNumber,
			description,
			customFields,
		} = context.propsValue;
		return await zohoDeskApi.updateContract({
			auth: context.auth,
			orgId,
			contractId,
			contractName,
			accountId,
			departmentId,
			ownerId,
			associatedSupportPlanId,
			startDate,
			endDate,
			associatedSLAId,
			productId,
			contractNumber,
			description,
			customFields,
		});
	},
});
