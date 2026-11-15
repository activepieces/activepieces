import { activeCampaignAuth } from '../../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { activecampaignCommon, makeClient } from '../../common';
import { addContactToAccountOutputSchema } from '../../common/output-schemas';

export const addContactToAccountAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_add_contact_to_account',
	classification: 'WRITE',
	displayName: 'Add Contact to Account',
	description: 'Adds a contact to an ActiveCampaign account.',
	audience: 'human',
	aiMetadata: { description: 'Associates an existing contact with an existing account (CRM organization), optionally recording the contact\'s job title at that account. Use when linking a person to a company already in the CRM. Requires both the contact ID and account ID. Not idempotent: repeating it for a contact that is already associated is not a no-op and may fail.', idempotent: false },
	outputSchema: addContactToAccountOutputSchema,
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

		const client = makeClient(context.auth.props);

		return (await client.createAccountContactAssociation({ contactId: Number(contactId), accountId: Number(accountId), jobTitle })).body;
	},
});
