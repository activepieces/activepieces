import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';

export const telnyxGetPhoneNumberMessagingSettingsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_phone_number_messaging_settings',
	displayName: 'Get Phone Number Messaging Settings',
	description: 'Gets the messaging settings of a phone number.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Gets a phone number's messaging settings: its messaging profile, messaging product, eligible products, traffic type, health and features.",
		idempotent: true,
	},
	props: {
		phoneNumberId: telnyxAiProps.phoneNumberId({ required: true }),
	},
	async run(context) {
		return await telnyxApi.getPhoneNumberMessagingSettings({
			auth: context.auth,
			phoneNumberId: context.propsValue.phoneNumberId,
		});
	},
});
