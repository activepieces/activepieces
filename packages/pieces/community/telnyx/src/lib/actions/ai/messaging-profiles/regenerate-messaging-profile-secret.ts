import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';

export const telnyxRegenerateMessagingProfileSecretAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_regenerate_messaging_profile_secret',
	displayName: 'Regenerate Messaging Profile Secret',
	description: 'Generates a new v1 webhook secret for a messaging profile.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			"Replaces the messaging profile's v1 webhook signing secret and returns the profile with the new secret. The old secret stops working immediately, so webhook receivers that verify with it fail until updated.",
		idempotent: false,
	},
	props: {
		messagingProfileId: telnyxAiProps.messagingProfileId({ required: true }),
	},
	async run(context) {
		return await telnyxApi.regenerateMessagingProfileSecret({
			auth: context.auth,
			messagingProfileId: context.propsValue.messagingProfileId,
		});
	},
});
