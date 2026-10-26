import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateTicketCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskCreateTicketCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_create_ticket_comment',
	outputSchema: zohoDeskCreateTicketCommentOutputSchema,
	displayName: 'Create Ticket Comment',
	description: 'Adds a comment to a ticket.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds a comment to one ticket; private by default so only agents see it, or public when Is Public is Yes. Not idempotent: each call adds another comment.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		content: Property.LongText({
			displayName: 'Content',
			description: 'Comment text. HTML unless Content Type is plainText.',
			required: true,
		}),
		isPublic: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Is Public',
			description: 'Yes shows the comment to the contact; No keeps it agent-only.',
		}),
		contentType: Property.StaticDropdown({
			displayName: 'Content Type',
			description: 'Format of Content. Defaults to html.',
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
		const { orgId, ticketId, content, isPublic, contentType } = context.propsValue;
		return await zohoDeskApi.createTicketComment({
			auth: context.auth,
			orgId,
			ticketId,
			content,
			isPublic,
			contentType,
		});
	},
});
