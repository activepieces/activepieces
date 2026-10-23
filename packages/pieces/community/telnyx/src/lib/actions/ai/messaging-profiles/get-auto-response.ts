import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';

export const telnyxGetAutoResponseAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_auto_response',
	displayName: 'Get Auto-Response',
	description: 'Gets one keyword auto-response.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one auto-response setting of a messaging profile by id.',
		idempotent: true,
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
		return await telnyxApi.getAutoResponse({
			auth: context.auth,
			messagingProfileId: p.messagingProfileId,
			autoResponseId: p.autoResponseId,
		});
	},
});
