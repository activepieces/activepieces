import { createAction } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsAiProps } from '../../common/ai-props';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsStatusOutputSchema } from '../../output-schemas';

export const addContactToDoNotMailAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_add_contact_to_do_not_mail',
	outputSchema: zohoCampaignsStatusOutputSchema,
	displayName: 'Add Contact to Do-Not-Mail',
	description: 'Blocks an email address from all future campaigns.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Moves an email address to the account-wide Do-Not-Mail registry so no campaign is ever sent to it again, across every list. Use Unsubscribe Contact to leave a single list instead. Cannot be undone through the API; idempotent.',
		idempotent: true,
	},
	props: {
		email: zohoCampaignsAiProps.contactEmail({ required: true }),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.addContactToDoNotMail({
			auth,
			contactinfo: zohoCampaignsUtils.contactInfo({ email: propsValue.email }),
		});
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
