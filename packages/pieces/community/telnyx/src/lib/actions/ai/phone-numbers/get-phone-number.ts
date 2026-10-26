import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';

export const telnyxGetPhoneNumberAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_phone_number',
	displayName: 'Get Phone Number',
	description: 'Gets a phone number.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one phone number by its resource id with its status, connection, messaging profile, emergency and feature flags.',
		idempotent: true,
	},
	props: {
		phoneNumberId: telnyxAiProps.phoneNumberId({ required: true }),
	},
	async run(context) {
		return await telnyxApi.getPhoneNumber({
			auth: context.auth,
			phoneNumberId: context.propsValue.phoneNumberId,
		});
	},
});
