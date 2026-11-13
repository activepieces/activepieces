import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsAiProps } from '../../common/ai-props';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsAddContactsToMailingListOutputSchema } from '../../output-schemas';

export const createMailingListAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_create_mailing_list',
	outputSchema: zohoCampaignsAddContactsToMailingListOutputSchema,
	displayName: 'Create Mailing List',
	description: 'Creates a mailing list with its first contacts.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a mailing list and adds 1 to 10 contacts by email (the API requires at least one), returning the new list key. Add more contacts with Add Contacts to Mailing List or Subscribe Contact. Not idempotent: each call creates a new list.',
		idempotent: false,
	},
	props: {
		listName: Property.ShortText({
			displayName: 'List Name',
			description:
				'Name of the new list. Use letters, digits and spaces; Zoho rejects "&" and some other punctuation and accented letters.',
			required: true,
		}),
		signupForm: zohoCampaignsAiProps.signupForm({ required: true }),
		emails: Property.Array({
			displayName: 'Emails',
			description: '1 to 10 email addresses to add to the new list.',
			required: true,
		}),
		description: Property.ShortText({
			displayName: 'Description',
			description: 'Description of the list.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.createMailingList({
			auth,
			listname: propsValue.listName,
			signupform: propsValue.signupForm,
			listdescription: propsValue.description,
			emailids: zohoCampaignsUtils.joinEmails({ emails: propsValue.emails, propName: 'Emails' }),
		});
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
