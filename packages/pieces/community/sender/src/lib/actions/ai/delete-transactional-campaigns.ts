import { createAction, Property } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderApi } from '../../common/api';
import { senderUtils } from '../../common/utils';
import { senderSuccessOutputSchema } from '../../output-schemas';

export const senderDeleteTransactionalCampaignsAction = createAction({
	auth: senderAuth,
	name: 'sender_delete_transactional_campaigns',
	outputSchema: senderSuccessOutputSchema,
	displayName: 'Delete Transactional Campaigns',
	description: 'Deletes one or more transactional campaigns.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes the listed transactional campaigns. Integrations that still send them will fail. Cannot be undone.',
		idempotent: false,
	},
	props: {
		campaignIds: Property.Array({
			displayName: 'Transactional Campaign IDs',
			description:
				'IDs of the transactional campaigns to delete. Use List Transactional Campaigns.',
			required: true,
		}),
	},
	async run(context) {
		return await senderApi.deleteTransactionalCampaigns({
			auth: context.auth,
			campaignIds: senderUtils.requiredStringList({
				value: context.propsValue.campaignIds,
				propName: 'Transactional Campaign IDs',
			}),
		});
	},
});
