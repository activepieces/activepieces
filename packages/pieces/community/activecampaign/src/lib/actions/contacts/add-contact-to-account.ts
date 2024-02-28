import { activeCampaignAuth } from '../../..';
import { Property, createAction } from '@activepieces/pieces-framework';
import { activecampaignCommon, makeClient } from '../../common';

export const addContactToAccountAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_add_contact_to_account',
	displayName: 'Add Contact to Account',
	description: 'Adds a contact to an ActiveCampaign account.',
	props: {
		contactId: activecampaignCommon.contactId,
		accountId: activecampaignCommon.accountId,
		jobTitle: Property.ShortText({
			displayName: 'Job Title',
			required: false,
		}),
	},
	async run(context) {
		const { contactId, accountId, jobTitle } = context.propsValue;

		const client = makeClient(context.auth);

		return await client.createAccountContactAssociation(
			Number(contactId),
			Number(accountId),
			jobTitle,
		);
	},
});
