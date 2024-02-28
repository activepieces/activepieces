import { activeCampaignAuth } from '../../..';
import { createAction } from '@activepieces/pieces-framework';
import { activecampaignCommon, makeClient } from '../../common';

export const addTagToContactAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_add_tag_to_contact',
	displayName: 'Add Tag to Contact',
	description: 'Adds a tag to contact.',
	props: {
		contactId: activecampaignCommon.contactId,
		tagId: activecampaignCommon.tagId,
	},
	async run(context) {
		const { contactId, tagId } = context.propsValue;

		const client = makeClient(context.auth);
		return await client.addTagToContact(contactId, tagId);
	},
});
