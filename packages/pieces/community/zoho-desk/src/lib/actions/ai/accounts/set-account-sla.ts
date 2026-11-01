import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskSetAccountSlaOutputSchema } from '../../../output-schemas';

export const zohoDeskSetAccountSlaAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_set_account_sla',
	outputSchema: zohoDeskSetAccountSlaOutputSchema,
	displayName: 'Set Account SLA',
	description: 'Links or unlinks an SLA on an account.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Links one SLA policy to an account, or unlinks it when Associate is No. Needs the Desk.accounts.UPDATE scope.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountId: zohoDeskAiProps.accountId({ required: true }),
		slaId: Property.ShortText({
			displayName: 'SLA ID',
			description: 'SLA policy ID (the `sla.id` of a plan from List Support Plans, or from List Account SLAs).',
			required: true,
		}),
		associate: zohoDeskAiProps.yesNo({
			required: true,
			displayName: 'Associate',
			description: 'Yes links the SLA, No unlinks it.',
		}),
	},
	async run(context) {
		const { orgId, accountId, slaId, associate } = context.propsValue;
		await zohoDeskApi.setAccountSla({ auth: context.auth, orgId, accountId, slaId, associate });
		return { success: true, accountId, slaId, associate };
	},
});
