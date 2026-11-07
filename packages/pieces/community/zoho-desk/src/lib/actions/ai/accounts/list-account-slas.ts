import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountSlasOutputSchema } from '../../../output-schemas';

export const zohoDeskListAccountSlasAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_account_slas',
	outputSchema: zohoDeskListAccountSlasOutputSchema,
	displayName: 'List Account SLAs',
	description: 'Lists the SLAs linked to an account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the SLA policies linked to one account. The SLA `id` feeds Set Account SLA.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountId: zohoDeskAiProps.accountId({ required: true }),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only SLAs with this status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'ACTIVE', value: 'ACTIVE' },
					{ label: 'INACTIVE', value: 'INACTIVE' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, accountId, departmentId, status, from, limit } = context.propsValue;
		const slas = await zohoDeskApi.listAccountSlas({
			auth: context.auth,
			orgId,
			accountId,
			departmentId,
			status,
			from,
			limit,
		});
		return { slas, count: slas.length };
	},
});
