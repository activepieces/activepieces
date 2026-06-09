import { activeCampaignAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';
import { activecampaignCommon, makeClient } from '../../common';

export const addTagToContactAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_add_tag_to_contact',
	displayName: 'Add Tag to Contact',
	description: 'Adds a tag to contact.',
	audience: 'both',
	aiMetadata: { description: 'Attaches an existing tag to a contact for segmentation or automation triggering. Use when you have the contact ID and tag ID and want to label that contact. Not idempotent: each call creates a new contact-tag association record.', idempotent: false },
	props: {
		contactId: activecampaignCommon.contactId,
		tagId: activecampaignCommon.tagId,
	},
	async run(context) {
		const { contactId, tagId } = context.propsValue;

		const client = makeClient(context.auth.props);
		return await client.addTagToContact(contactId, tagId);
	},
});
