import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskCloseTicketsOutputSchema } from '../../../output-schemas';

export const zohoDeskMarkTicketsSpamAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_mark_tickets_spam',
	outputSchema: zohoDeskCloseTicketsOutputSchema,
	displayName: 'Mark Tickets Spam',
	description: 'Marks tickets as spam or not spam.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Marks one or more tickets as spam (Is Spam = Yes) or clears the spam mark (No). Optionally marks their contacts as spam too.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketIds: Property.Array({
			displayName: 'Ticket IDs',
			description: 'Ticket IDs to mark.',
			required: true,
		}),
		isSpam: zohoDeskAiProps.yesNo({
			required: true,
			displayName: 'Is Spam',
			description: 'Yes marks the tickets as spam, No removes the spam mark.',
		}),
		contactSpam: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Mark Contacts As Spam',
			description: "Yes also marks the tickets' contacts as spam.",
		}),
		handleExistingTickets: zohoDeskAiProps.yesNo({
			required: false,
			displayName: "Include Contacts' Other Tickets",
			description: 'Yes also marks the other tickets of those contacts.',
		}),
	},
	async run(context) {
		const { orgId, ticketIds, isSpam, contactSpam, handleExistingTickets } = context.propsValue;
		await zohoDeskApi.markTicketsSpam({
			auth: context.auth,
			orgId,
			ticketIds: zohoDeskUtils.requiredStringList({ value: ticketIds, propName: 'Ticket IDs' }),
			isSpam,
			contactSpam,
			handleExistingTickets,
		});
		return { success: true, ticketIds };
	},
});
