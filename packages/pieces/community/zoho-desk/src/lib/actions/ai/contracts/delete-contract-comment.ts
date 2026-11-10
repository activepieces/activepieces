import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskDeleteContractCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteContractCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_contract_comment',
	outputSchema: zohoDeskDeleteContractCommentOutputSchema,
	displayName: 'Delete Contract Comment',
	description: 'Deletes a comment from a contract.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes one comment from a contract.',
		idempotent: false,
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
		await zohoDeskApi.deleteContractComment({ auth: context.auth, orgId, contractId, commentId });
		return { success: true, contractId, commentId };
	},
});
