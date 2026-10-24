import { createAction } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsAiProps } from '../../common/ai-props';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsStatusOutputSchema } from '../../output-schemas';

export const unsubscribeContactAiAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_unsubscribe_contact',
	outputSchema: zohoCampaignsStatusOutputSchema,
	displayName: 'Unsubscribe Contact',
	description: 'Unsubscribes a contact from a mailing list.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Unsubscribes a contact, matched by email, from a mailing list (key from List Mailing Lists), optionally only from one topic. The contact stays in the account. Idempotent: an unsubscribed contact stays unsubscribed.',
		idempotent: true,
	},
	props: {
		listKey: zohoCampaignsAiProps.listKey({ required: true }),
		email: zohoCampaignsAiProps.contactEmail({ required: true }),
		topicId: zohoCampaignsAiProps.topicId({ required: false }),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.unsubscribeContact({
			auth,
			listkey: propsValue.listKey,
			contactinfo: zohoCampaignsUtils.contactInfo({ email: propsValue.email }),
			topic_id: propsValue.topicId,
		});
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
