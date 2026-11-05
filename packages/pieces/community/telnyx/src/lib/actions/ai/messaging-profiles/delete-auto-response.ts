import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';

export const telnyxDeleteAutoResponseAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_delete_auto_response',
	displayName: 'Delete Auto-Response',
	description: 'Deletes a keyword auto-response.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one auto-response setting from a messaging profile. Cannot be undone.',
		idempotent: false,
	},
	props: {
		messagingProfileId: telnyxAiProps.messagingProfileId({ required: true }),
		autoResponseId: Property.ShortText({
			displayName: 'Auto-Response ID',
			description: 'Auto-response setting ID. Use List Auto-Responses to find it.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.deleteAutoResponse({
			auth: context.auth,
			messagingProfileId: p.messagingProfileId,
			autoResponseId: p.autoResponseId,
		});
	},
});
