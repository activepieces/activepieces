import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsAiProps } from '../../common/ai-props';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsAddContactsToMailingListOutputSchema } from '../../output-schemas';

export const addContactsToMailingListAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_add_contacts_to_mailing_list',
	outputSchema: zohoCampaignsAddContactsToMailingListOutputSchema,
	displayName: 'Add Contacts to Mailing List',
	description: 'Adds up to 10 email addresses to a mailing list in one call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds 1 to 10 email addresses to an existing mailing list (key from List Mailing Lists) in one call, without other fields. Use Subscribe Contact to set names or custom fields. Idempotent: addresses already on the list stay as they are.',
		idempotent: true,
	},
	props: {
		listKey: zohoCampaignsAiProps.listKey({ required: true }),
		emails: Property.Array({
			displayName: 'Emails',
			description: '1 to 10 email addresses to add.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.addContactsToMailingList({
			auth,
			listkey: propsValue.listKey,
			emailids: zohoCampaignsUtils.joinEmails({ emails: propsValue.emails, propName: 'Emails' }),
		});
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
