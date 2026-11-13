import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskRemoveTicketTagsOutputSchema } from '../../../output-schemas';

export const zohoDeskRemoveTicketTagsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_remove_ticket_tags',
	outputSchema: zohoDeskRemoveTicketTagsOutputSchema,
	displayName: 'Remove Ticket Tags',
	description: 'Removes tags from a ticket.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Removes the named tags from one ticket; other tags stay.',
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
			description: 'Tag names to remove.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, ticketId, tags } = context.propsValue;
		await zohoDeskApi.removeTicketTags({
			auth: context.auth,
			orgId,
			ticketId,
			tags: zohoDeskUtils.requiredStringList({ value: tags, propName: 'Tags' }),
		});
		return { success: true, ticketId, tags };
	},
});
