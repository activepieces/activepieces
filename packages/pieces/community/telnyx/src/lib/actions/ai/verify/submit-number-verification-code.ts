import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxSubmitNumberVerificationCodeAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_submit_number_verification_code',
	displayName: 'Submit Number Verification Code',
	description: 'Completes caller-ID verification with the received code.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Completes caller-ID verification of an external number by submitting the code it received after Request Number Verification. Returns the verified number with its verified_at time.',
		idempotent: false,
	},
	props: {
		phoneNumber: Property.ShortText({
			displayName: 'Phone Number',
			description: 'External phone number in E.164 format, e.g. "+13125550002".',
			required: true,
		}),
		verificationCode: Property.ShortText({
			displayName: 'Verification Code',
			description: 'The code the number received.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.submitNumberVerificationCode({
			auth: context.auth,
			phoneNumber: p.phoneNumber,
			verificationCode: p.verificationCode,
		});
	},
});
