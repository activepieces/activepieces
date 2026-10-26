import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUpdateContractCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskUpdateContractCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_update_contract_comment',
	outputSchema: zohoDeskUpdateContractCommentOutputSchema,
	displayName: 'Update Contract Comment',
	description: 'Edits a comment on a contract.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: { description: 'Replaces the text of one comment on a contract.', idempotent: true },
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
		content: Property.LongText({
			displayName: 'Content',
			description: 'New comment text.',
			required: true,
		}),
		contentType: Property.StaticDropdown({
			displayName: 'Content Type',
			description: 'Format of Content.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'html', value: 'html' },
					{ label: 'plainText', value: 'plainText' },
				],
			},
		}),
	},
	async run(context) {
		const { orgId, contractId, commentId, content, contentType } = context.propsValue;
		return await zohoDeskApi.updateContractComment({
			auth: context.auth,
			orgId,
			contractId,
			commentId,
			content,
			contentType,
		});
	},
});
