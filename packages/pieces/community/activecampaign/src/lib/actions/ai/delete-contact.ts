import { createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { activeCampaignApi } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { deleteContactOutputSchema } from '../../common/output-schemas';

export const deleteContactAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_delete_contact',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Contact',
	description: 'Permanently deletes a contact.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently deletes one contact, identified by ID or email, with its history. Cannot be undone; to stop emails instead, use Unsubscribe Contact from List. A repeat fails because the contact no longer exists.',
		idempotent: false,
	},
	outputSchema: deleteContactOutputSchema,
	props: {
		contact_id_or_email: aiProps.contactIdOrEmail(),
	},
	async run({ auth, propsValue }) {
		const client = makeClient(auth.props);
		const contactId = await aiInput.resolveContactId({ client, value: propsValue.contact_id_or_email, label: 'Contact ID or Email' });
		await client.request({ method: 'DELETE', path: `/contacts/${activeCampaignApi.segment(contactId)}` });
		return { deleted: true, contactId };
	},
});
