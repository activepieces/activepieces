import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateCallCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskGetContractCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_contract_comment',
	outputSchema: zohoDeskCreateCallCommentOutputSchema,
	displayName: 'Get Contract Comment',
	description: 'Gets one comment on a contract.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one comment on a contract, with its author and content.',
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
		commentId: Property.ShortText({
			displayName: 'Comment ID',
			description: 'Comment ID (from List Contract Comments).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, contractId, commentId } = context.propsValue;
		return await zohoDeskApi.getContractComment({
			auth: context.auth,
			orgId,
			contractId,
			commentId,
		});
	},
});
