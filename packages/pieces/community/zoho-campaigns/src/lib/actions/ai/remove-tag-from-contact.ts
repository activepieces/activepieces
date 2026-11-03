import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsAiProps } from '../../common/ai-props';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsStatusOutputSchema } from '../../output-schemas';

export const removeTagFromContactAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_remove_tag_from_contact',
	outputSchema: zohoCampaignsStatusOutputSchema,
	displayName: 'Remove Tag from Contact',
	description: 'Removes a tag from a contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Removes a tag (by name, from List Tags) from a contact matched by email. The tag itself stays; use Delete Tag to remove it from the account. Idempotent.',
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
		const body = await zohoCampaignsApi.removeTag({
			auth,
			tagName: propsValue.tagName,
			lead_email: propsValue.email,
		});
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
