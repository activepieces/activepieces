import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountAttachmentsOutputSchema } from '../../../output-schemas';

export const zohoDeskListContactAttachmentsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_contact_attachments',
	outputSchema: zohoDeskListAccountAttachmentsOutputSchema,
	displayName: 'List Contact Attachments',
	description: 'Lists the files attached to a contact.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the files attached to one contact, with name, size and download link (`href`).',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, contactId, from, limit } = context.propsValue;
		const attachments = await zohoDeskApi.listContactAttachments({
			auth: context.auth,
			orgId,
			contactId,
			from,
			limit,
		});
		return { attachments, count: attachments.length };
	},
});
