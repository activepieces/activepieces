import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxCheckVerificationCodeAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_check_verification_code',
	displayName: 'Check Verification Code',
	description: 'Checks a code the user entered against a verification.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Checks a code against one verification by id (from Send SMS Verification, Send Call Verification or Send Flash Call Verification). The response_code is accepted or rejected; a wrong code still returns normally, so read response_code. Each check counts as an attempt.',
		idempotent: false,
	},
	props: {
		verificationId: Property.ShortText({
			displayName: 'Verification ID',
			description:
				'Verification UUID, returned by Send SMS Verification, Send Call Verification or Send Flash Call Verification.',
			required: true,
		}),
		code: Property.ShortText({
			displayName: 'Code',
			description: 'The code the user received.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.checkVerificationCode({
			auth: context.auth,
			verificationId: p.verificationId,
			body: { code: p.code },
		});
	},
});
