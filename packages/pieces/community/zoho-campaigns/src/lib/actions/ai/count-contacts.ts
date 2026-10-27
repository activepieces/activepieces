import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsAiProps } from '../../common/ai-props';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsCountContactsOutputSchema } from '../../output-schemas';

export const countContactsAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_count_contacts',
	outputSchema: zohoCampaignsCountContactsOutputSchema,
	displayName: 'Count Contacts',
	description: 'Counts the contacts of a mailing list, optionally by status.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Counts the contacts of a mailing list (key from List Mailing Lists), optionally only those that are active, unsubscribed, bounced or marked as spam.',
		idempotent: true,
	},
	props: {
		listKey: zohoCampaignsAiProps.listKey({ required: true }),
		status: Property.StaticDropdown<'active' | 'unsub' | 'bounce' | 'spam', false>({
			displayName: 'Status',
			description: 'Only count contacts in this status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Active', value: 'active' },
					{ label: 'Unsubscribed', value: 'unsub' },
					{ label: 'Bounced', value: 'bounce' },
					{ label: 'Spam', value: 'spam' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.countContacts({
			auth,
			listkey: propsValue.listKey,
			status: propsValue.status,
		});
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
