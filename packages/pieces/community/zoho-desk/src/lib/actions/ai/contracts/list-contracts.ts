import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskListContractsOutputSchema } from '../../../output-schemas';

export const zohoDeskListContractsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_contracts',
	outputSchema: zohoDeskListContractsOutputSchema,
	displayName: 'List Contracts',
	description: 'Lists support contracts.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists support contracts, optionally for one account, by name, owner or department. Page with From and Limit.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountId: zohoDeskAiProps.accountId({ required: false }),
		contractName: Property.ShortText({
			displayName: 'Contract Name',
			description: 'Only contracts with this name.',
			required: false,
		}),
		departmentIds: Property.Array({
			displayName: 'Department IDs',
			description: 'Only contracts in these departments.',
			required: false,
		}),
		ownerIds: Property.Array({
			displayName: 'Owner IDs',
			description: 'Only contracts owned by these agents.',
			required: false,
		}),
		viewId: Property.ShortText({
			displayName: 'View ID',
			description: 'Contract view ID (from List Views, module contracts).',
			required: false,
		}),
		sortBy: Property.StaticDropdown({
			displayName: 'Sort By',
			description: 'Field to sort by.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'contractName', value: 'contractName' },
					{ label: 'accountName', value: 'accountName' },
					{ label: 'contractStartDate', value: 'contractStartDate' },
					{ label: 'contractEndDate', value: 'contractEndDate' },
					{ label: 'createdTime', value: 'createdTime' },
					{ label: 'modifiedTime', value: 'modifiedTime' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, accountId, contractName, departmentIds, ownerIds, viewId, sortBy, from, limit } =
			context.propsValue;
		const contracts = await zohoDeskApi.listContracts({
			auth: context.auth,
			orgId,
			accountId,
			contractName,
			departmentIds: zohoDeskUtils.optionalStringList({
				value: departmentIds,
				propName: 'Department IDs',
			}),
			ownerIds: zohoDeskUtils.optionalStringList({ value: ownerIds, propName: 'Owner IDs' }),
			viewId,
			sortBy,
			from,
			limit,
		});
		return { contracts, count: contracts.length };
	},
});
