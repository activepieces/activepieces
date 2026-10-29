import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetAccountOutputSchema } from '../../../output-schemas';

export const zohoDeskGetAccountAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_account',
	outputSchema: zohoDeskGetAccountOutputSchema,
	displayName: 'Get Account',
	description: 'Gets an account by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one account by ID with all fields, including owner and custom fields (`cf`).',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountId: zohoDeskAiProps.accountId({ required: true }),
	},
	async run(context) {
		const { orgId, accountId } = context.propsValue;
		return await zohoDeskApi.getAccount({ auth: context.auth, orgId, accountId });
	},
});
