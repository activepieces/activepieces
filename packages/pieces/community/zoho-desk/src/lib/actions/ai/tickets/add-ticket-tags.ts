import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskAddTicketTagsOutputSchema } from '../../../output-schemas';

export const zohoDeskAddTicketTagsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_add_ticket_tags',
	outputSchema: zohoDeskAddTicketTagsOutputSchema,
	displayName: 'Add Ticket Tags',
	description: 'Adds tags to a ticket.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Adds tags to one ticket, creating tags that don't exist yet. Tags already on the ticket are kept.",
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		tags: Property.Array({
			displayName: 'Tags',
			description: 'Tag names to add, e.g. ["billing", "vip"].',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, ticketId, tags } = context.propsValue;
		return await zohoDeskApi.addTicketTags({
			auth: context.auth,
			orgId,
			ticketId,
			tags: zohoDeskUtils.requiredStringList({ value: tags, propName: 'Tags' }),
		});
	},
});
