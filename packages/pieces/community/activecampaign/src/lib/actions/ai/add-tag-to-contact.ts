import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiInput, aiProps } from '../../common/ai-props';
import { addTagToContactAiOutputSchema } from '../../common/output-schemas';
import { acData } from '../../common/types';

export const addTagToContactAiAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_add_tag_to_contact_ai',
	classification: 'WRITE',
	displayName: 'Add Tag to Contact (AI)',
	description: 'Adds a tag to a contact.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Adds an existing tag to a contact (by contact ID or email). Find the tag ID with List Tags, or make one with Create Tag. Safe to repeat: when the contact already has the tag, nothing changes and created is false.',
		idempotent: true,
	},
	outputSchema: addTagToContactAiOutputSchema,
	props: {
		contact_id_or_email: aiProps.contactIdOrEmail(),
		tag_id: Property.ShortText({ displayName: 'Tag ID', description: 'Use List Tags to find the ID.', required: true }),
	},
	async run({ auth, propsValue }) {
		const client = makeClient(auth.props);
		const tagId = aiInput.numericId({ value: propsValue.tag_id, label: 'Tag ID' });
		const contactId = await aiInput.resolveContactId({ client, value: propsValue.contact_id_or_email, label: 'Contact ID or Email' });
		const response = await client.addTagToContact({ contactId, tagId });
		const association = acData.recordAt({ value: response.body, key: 'contactTag' });
		return { associationId: acData.textAt({ value: association, key: 'id' }), contactId, tagId, created: response.status === 201 };
	},
});
