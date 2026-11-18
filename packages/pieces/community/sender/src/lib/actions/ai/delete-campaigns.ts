import { createAction, Property } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderApi } from '../../common/api';
import { senderUtils } from '../../common/utils';
import { senderSuccessOutputSchema } from '../../output-schemas';

export const senderDeleteCampaignsAction = createAction({
	auth: senderAuth,
	name: 'sender_delete_campaigns',
	outputSchema: senderSuccessOutputSchema,
	displayName: 'Delete Campaigns',
	description: 'Deletes one or more email campaigns.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Deletes the listed email campaigns, with their reports. Cannot be undone.',
		idempotent: false,
	},
	props: {
		campaignIds: Property.Array({
			displayName: 'Campaign IDs',
			description: 'IDs of the campaigns to delete. Use List Campaigns.',
			required: true,
		}),
	},
	async run(context) {
		return await senderApi.deleteCampaigns({
			auth: context.auth,
			campaignIds: senderUtils.requiredStringList({
				value: context.propsValue.campaignIds,
				propName: 'Campaign IDs',
			}),
		});
	},
});
