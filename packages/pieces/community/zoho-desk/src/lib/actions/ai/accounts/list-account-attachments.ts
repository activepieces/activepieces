import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountAttachmentsOutputSchema } from '../../../output-schemas';

export const zohoDeskListAccountAttachmentsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_account_attachments',
	outputSchema: zohoDeskListAccountAttachmentsOutputSchema,
	displayName: 'List Account Attachments',
	description: 'Lists the files attached to a account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the files attached to one account, with name, size and download link (`href`).',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountId: zohoDeskAiProps.accountId({ required: true }),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, accountId, from, limit } = context.propsValue;
		const attachments = await zohoDeskApi.listAccountAttachments({
			auth: context.auth,
			orgId,
			accountId,
			from,
			limit,
		});
		return { attachments, count: attachments.length };
	},
});
