import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';

export const telnyxGetPhoneNumberVoiceSettingsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_phone_number_voice_settings',
	displayName: 'Get Phone Number Voice Settings',
	description: 'Gets the voice settings of a phone number.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Gets a phone number's voice settings: connection, call forwarding, CNAM listing, call recording, media features, inbound call screening and usage payment method.",
		idempotent: true,
	},
	props: {
		phoneNumberId: telnyxAiProps.phoneNumberId({ required: true }),
	},
	async run(context) {
		return await telnyxApi.getPhoneNumberVoiceSettings({
			auth: context.auth,
			phoneNumberId: context.propsValue.phoneNumberId,
		});
	},
});
