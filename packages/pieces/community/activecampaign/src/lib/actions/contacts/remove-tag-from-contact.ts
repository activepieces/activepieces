import { createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { activecampaignCommon, makeClient } from '../../common';
import { removeTagOutputSchema } from '../../common/output-schemas';

export const removeTagFromContactAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_remove_tag_from_contact_human',
	classification: 'WRITE',
	displayName: 'Remove Tag from Contact',
	description: 'Removes a tag from a contact. Does nothing when the contact does not have the tag.',
	audience: 'human',
	aiMetadata: {
		description: 'Removes a tag from a contact. Safe to repeat: when the contact does not have the tag, nothing changes and removed is false.',
		idempotent: true,
	},
	outputSchema: removeTagOutputSchema,
	props: {
		contactId: activecampaignCommon.contactId,
		tagId: activecampaignCommon.tagId,
	},
	async run({ auth, propsValue }) {
		return makeClient(auth.props).removeTagFromContact({ contactId: propsValue.contactId, tagId: propsValue.tagId });
	},
});
