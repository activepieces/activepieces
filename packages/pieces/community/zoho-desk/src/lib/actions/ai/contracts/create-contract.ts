import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateContractOutputSchema } from '../../../output-schemas';

export const zohoDeskCreateContractAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_create_contract',
	outputSchema: zohoDeskCreateContractOutputSchema,
	displayName: 'Create Contract',
	description: 'Creates a support contract for an account.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a support contract for an account, with a support plan, owner, department and start date. Not idempotent: each call creates a new contract.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contractName: Property.ShortText({
			displayName: 'Contract Name',
			description: 'Contract name.',
			required: true,
		}),
		accountId: zohoDeskAiProps.accountId({ required: true }),
		departmentId: zohoDeskAiProps.departmentId({ required: true }),
		ownerId: Property.ShortText({
			displayName: 'Owner ID',
			description: 'Agent ID who owns the contract (from List Agents).',
			required: true,
		}),
		associatedSupportPlanId: Property.ShortText({
			displayName: 'Support Plan ID',
			description: 'Support plan the contract covers (from List Support Plans).',
			required: true,
		}),
		startDate: Property.ShortText({
			displayName: 'Start Date',
			description: 'Start date, YYYY-MM-DD.',
			required: true,
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
		return await zohoDeskApi.createContract({
			auth: context.auth,
			orgId,
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
