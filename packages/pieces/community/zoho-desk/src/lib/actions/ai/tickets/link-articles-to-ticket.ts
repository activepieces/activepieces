import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskLinkArticlesToTicketOutputSchema } from '../../../output-schemas';

export const zohoDeskLinkArticlesToTicketAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_link_articles_to_ticket',
	outputSchema: zohoDeskLinkArticlesToTicketOutputSchema,
	displayName: 'Link Articles To Ticket',
	description: 'Records that knowledge-base articles were used on a ticket.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Records that the given knowledge-base articles (from Search Articles or Get Suggested Articles) were used to answer one ticket.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		articleIds: Property.Array({
			displayName: 'Article IDs',
			description: 'Article IDs that were used.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, ticketId, articleIds } = context.propsValue;
		await zohoDeskApi.linkArticlesToTicket({
			auth: context.auth,
			orgId,
			ticketId,
			articleIds: zohoDeskUtils.requiredStringList({ value: articleIds, propName: 'Article IDs' }),
		});
		return { success: true, ticketId, articleIds };
	},
});
