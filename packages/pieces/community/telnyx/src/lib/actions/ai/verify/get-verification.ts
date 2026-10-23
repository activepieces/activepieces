import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxGetVerificationAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_verification',
	displayName: 'Get Verification',
	description: 'Gets the status of a verification.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one verification by id: channel type, phone number, Verify profile and status (pending, accepted, expired and so on). Use the id from Send SMS Verification, Send Call Verification or Send Flash Call Verification.',
		idempotent: true,
	},
	props: {
		verificationId: Property.ShortText({
			displayName: 'Verification ID',
			description:
				'Verification UUID, returned by Send SMS Verification, Send Call Verification or Send Flash Call Verification.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.getVerification({
			auth: context.auth,
			verificationId: context.propsValue.verificationId,
		});
	},
});
