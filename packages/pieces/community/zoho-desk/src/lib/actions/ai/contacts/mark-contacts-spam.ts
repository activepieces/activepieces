import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskAssociateAccountProductsOutputSchema } from '../../../output-schemas';

export const zohoDeskMarkContactsSpamAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_mark_contacts_spam',
	outputSchema: zohoDeskAssociateAccountProductsOutputSchema,
	displayName: 'Mark Contacts Spam',
	description: 'Marks contacts as spam or not spam.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Marks one or more contacts as spam (Is Spam = Yes) or clears the mark (No), optionally doing the same to their existing tickets.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactIds: Property.Array({
			displayName: 'Contact IDs',
			description: 'Contact IDs to mark.',
			required: true,
		}),
		isSpam: zohoDeskAiProps.yesNo({
			required: true,
			displayName: 'Is Spam',
			description: 'Yes marks the contacts as spam, No removes the mark.',
		}),
		handleExistingTickets: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Include Their Tickets',
			description: "Yes also marks the contacts' existing tickets.",
		}),
	},
	async run(context) {
		const { orgId, contactIds, isSpam, handleExistingTickets } = context.propsValue;
		return await zohoDeskApi.markContactsSpam({
			auth: context.auth,
			orgId,
			contactIds: zohoDeskUtils.requiredStringList({ value: contactIds, propName: 'Contact IDs' }),
			isSpam,
			handleExistingTickets,
		});
	},
});
