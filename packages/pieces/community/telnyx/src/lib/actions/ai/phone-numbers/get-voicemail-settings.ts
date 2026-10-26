import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';

export const telnyxGetVoicemailSettingsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_voicemail_settings',
	displayName: 'Get Voicemail Settings',
	description: 'Gets the voicemail settings of a phone number.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets whether voicemail is enabled on a phone number, its PIN and greeting. Fails with 404 when voicemail was never set up; use Create Voicemail Settings then.',
		idempotent: true,
	},
	props: {
		phoneNumberId: telnyxAiProps.phoneNumberId({ required: true }),
	},
	async run(context) {
		return await telnyxApi.getVoicemailSettings({
			auth: context.auth,
			phoneNumberId: context.propsValue.phoneNumberId,
		});
	},
});
