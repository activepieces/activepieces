import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';

export const telnyxGetMessagingProfileAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_messaging_profile',
	displayName: 'Get Messaging Profile',
	description: 'Gets a messaging profile.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one messaging profile by id with all its settings: webhooks, allowed destinations, number pool, URL shortener and spend limit.',
		idempotent: true,
	},
	props: {
		messagingProfileId: telnyxAiProps.messagingProfileId({ required: true }),
	},
	async run(context) {
		return await telnyxApi.getMessagingProfile({
			auth: context.auth,
			messagingProfileId: context.propsValue.messagingProfileId,
		});
	},
});
