import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxGetVerifyProfileAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_verify_profile',
	displayName: 'Get Verify Profile',
	description: 'Gets a Verify profile.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one Verify profile by id, with its SMS, call, flash call and WhatsApp settings, language, webhooks and spend limit. Use List Verify Profiles to find the id.',
		idempotent: true,
	},
	props: {
		verifyProfileId: Property.ShortText({
			displayName: 'Verify Profile ID',
			description: 'Verify profile UUID. Use List Verify Profiles to find it.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.getVerifyProfile({
			auth: context.auth,
			verifyProfileId: context.propsValue.verifyProfileId,
		});
	},
});
