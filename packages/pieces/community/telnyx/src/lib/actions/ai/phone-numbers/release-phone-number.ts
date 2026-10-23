import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';

export const telnyxReleasePhoneNumberAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_release_phone_number',
	displayName: 'Release Phone Number',
	description: 'Releases a phone number from the account.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Releases (deletes) a phone number from the account and returns it. The number cannot be recovered and may be bought by someone else. Fails while the number has deletion lock enabled.',
		idempotent: false,
	},
	props: {
		phoneNumberId: telnyxAiProps.phoneNumberId({ required: true }),
	},
	async run(context) {
		return await telnyxApi.releasePhoneNumber({
			auth: context.auth,
			phoneNumberId: context.propsValue.phoneNumberId,
		});
	},
});
