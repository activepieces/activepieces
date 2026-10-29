import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsAiProps } from '../../common/ai-props';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsStatusOutputSchema } from '../../output-schemas';

export const deleteMailingListAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_delete_mailing_list',
	outputSchema: zohoCampaignsStatusOutputSchema,
	displayName: 'Delete Mailing List',
	description: 'Permanently deletes a mailing list, optionally with its contacts.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a mailing list (key from List Mailing Lists). Delete Contacts set to Yes also deletes its contacts from the whole account; otherwise they are only removed from the list. Cannot be undone.',
		idempotent: false,
	},
	props: {
		listKey: zohoCampaignsAiProps.listKey({ required: true }),
		deleteContacts: Property.StaticDropdown<'on' | 'off', false>({
			displayName: 'Delete Contacts',
			description: 'Yes also deletes the list contacts from the account. Defaults to No.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Yes', value: 'on' },
					{ label: 'No', value: 'off' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.deleteMailingList({
			auth,
			listkey: propsValue.listKey,
			deletecontacts: propsValue.deleteContacts,
		});
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
