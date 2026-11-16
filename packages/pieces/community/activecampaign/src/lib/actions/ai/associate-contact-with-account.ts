import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiInput, aiProps } from '../../common/ai-props';
import { associateContactWithAccountOutputSchema } from '../../common/output-schemas';
import { acData } from '../../common/types';

export const associateContactWithAccountAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_associate_contact_with_account',
	classification: 'WRITE',
	displayName: 'Associate Contact with Account (AI)',
	description: 'Links a contact to an account (company). A contact can belong to only one account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Links a contact (by ID or email) to an account, optionally with the contact\'s job title there. Find the account ID with List Accounts. A contact can belong to only one account: if it is already linked to any account, including this one, ActiveCampaign rejects the call with a 422, so do not repeat it.',
		idempotent: false,
	},
	outputSchema: associateContactWithAccountOutputSchema,
	props: {
		contact_id_or_email: aiProps.contactIdOrEmail(),
		account_id: Property.ShortText({ displayName: 'Account ID', description: 'Use List Accounts to find the ID.', required: true }),
		job_title: Property.ShortText({ displayName: 'Job Title', required: false }),
	},
	async run({ auth, propsValue }) {
		const client = makeClient(auth.props);
		const accountId = aiInput.numericId({ value: propsValue.account_id, label: 'Account ID' });
		const contactId = await aiInput.resolveContactId({ client, value: propsValue.contact_id_or_email, label: 'Contact ID or Email' });
		const jobTitle = aiInput.optionalText(propsValue.job_title);
		const response = await client.createAccountContactAssociation({ contactId, accountId, jobTitle });
		const association = acData.recordAt({ value: response.body, key: 'accountContact' });
		return {
			associationId: acData.textAt({ value: association, key: 'id' }),
			contactId,
			accountId,
			jobTitle: acData.textAt({ value: association, key: 'jobTitle' }) ?? jobTitle,
		};
	},
});
