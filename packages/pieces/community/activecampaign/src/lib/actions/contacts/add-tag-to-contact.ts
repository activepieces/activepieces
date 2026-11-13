import { activeCampaignAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';
import { activecampaignCommon, makeClient } from '../../common';
import { addTagToContactOutputSchema } from '../../common/output-schemas';

export const addTagToContactAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_add_tag_to_contact',
	classification: 'WRITE',
	displayName: 'Add Tag to Contact',
	description: 'Adds a tag to contact.',
	audience: 'human',
	aiMetadata: { description: 'Attaches an existing tag to a contact for segmentation or automation triggering. Use when you have the contact ID and tag ID and want to label that contact. Safe to repeat: when the contact already has the tag, ActiveCampaign returns the existing association and changes nothing.', idempotent: true },
	outputSchema: addTagToContactOutputSchema,
	props: {
		contactId: activecampaignCommon.contactId,
		tagId: activecampaignCommon.tagId,
	},
	async run(context) {
		const { contactId, tagId } = context.propsValue;

		const client = makeClient(context.auth.props);
		return (await client.addTagToContact({ contactId, tagId })).body;
	},
});
