import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsAiProps } from '../../common/ai-props';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsStatusOutputSchema } from '../../output-schemas';

export const updateMailingListAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_update_mailing_list',
	outputSchema: zohoCampaignsStatusOutputSchema,
	displayName: 'Update Mailing List',
	description: 'Renames a mailing list and sets whether it has a public signup form.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets the name and signup-form visibility of a mailing list (key from List Mailing Lists). Both are required, so pass the current name to change only the signup form. Idempotent: the same values leave the list unchanged.',
		idempotent: true,
	},
	props: {
		listKey: zohoCampaignsAiProps.listKey({ required: true }),
		listName: Property.ShortText({
			displayName: 'List Name',
			description:
				'The name the list should have. Use letters, digits and spaces; Zoho rejects "&" and some other punctuation and accented letters.',
			required: true,
		}),
		signupForm: zohoCampaignsAiProps.signupForm({ required: true }),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.updateMailingList({
			auth,
			listkey: propsValue.listKey,
			newlistname: propsValue.listName,
			signupform: propsValue.signupForm,
		});
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
