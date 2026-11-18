import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiInput, aiProps } from '../../common/ai-props';
import { removeTagOutputSchema } from '../../common/output-schemas';

export const removeTagFromContactAiAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_remove_tag_from_contact',
	classification: 'WRITE',
	displayName: 'Remove Tag from Contact',
	description: 'Removes a tag from a contact.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Removes a tag from a contact (by contact ID or email). Find the tag ID with List Tags or Get Contact. Safe to repeat: when the contact does not have the tag, nothing changes and removed is false.',
		idempotent: true,
	},
	outputSchema: removeTagOutputSchema,
	props: {
		contact_id_or_email: aiProps.contactIdOrEmail(),
		tag_id: Property.ShortText({ displayName: 'Tag ID', description: 'Use List Tags or Get Contact to find the ID.', required: true }),
	},
	async run({ auth, propsValue }) {
		const client = makeClient(auth.props);
		const tagId = aiInput.numericId({ value: propsValue.tag_id, label: 'Tag ID' });
		const contactId = await aiInput.resolveContactId({ client, value: propsValue.contact_id_or_email, label: 'Contact ID or Email' });
		return client.removeTagFromContact({ contactId, tagId });
	},
});
