import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';

export const telnyxDeleteMessagingProfileAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_delete_messaging_profile',
	displayName: 'Delete Messaging Profile',
	description: 'Deletes a messaging profile.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a messaging profile and returns the deleted profile. Numbers on it stop sending and receiving messages until assigned to another profile. Cannot be undone.',
		idempotent: false,
	},
	props: {
		messagingProfileId: telnyxAiProps.messagingProfileId({ required: true }),
	},
	async run(context) {
		return await telnyxApi.deleteMessagingProfile({
			auth: context.auth,
			messagingProfileId: context.propsValue.messagingProfileId,
		});
	},
});
