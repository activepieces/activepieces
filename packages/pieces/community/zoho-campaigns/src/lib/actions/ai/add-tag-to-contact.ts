import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsAiProps } from '../../common/ai-props';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsAddTagToContactOutputSchema } from '../../output-schemas';

export const addTagToContactAiAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_add_tag_to_contact',
	outputSchema: zohoCampaignsAddTagToContactOutputSchema,
	displayName: 'Add Tag to Contact',
	description: 'Tags a contact by email, creating the tag if it does not exist.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds a tag to a contact matched by email, first creating the tag when no tag with that name exists. tagCreated in the result says whether it was created. Idempotent: re-tagging leaves the contact tagged.',
		idempotent: true,
	},
	props: {
		tagName: Property.ShortText({
			displayName: 'Tag Name',
			description: 'Name of the tag, as shown by List Tags.',
			required: true,
		}),
		email: zohoCampaignsAiProps.contactEmail({ required: true }),
	},
	async run({ auth, propsValue }) {
		const { created } = await zohoCampaignsApi.ensureTag({ auth, tagName: propsValue.tagName });
		const body = await zohoCampaignsApi.addTagToContact({
			auth,
			tagName: propsValue.tagName,
			lead_email: propsValue.email,
		});
		return { ...zohoCampaignsUtils.assertSuccess({ body }), tagCreated: created };
	},
});
