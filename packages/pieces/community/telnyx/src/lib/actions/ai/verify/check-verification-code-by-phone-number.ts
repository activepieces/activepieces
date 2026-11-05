import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxCheckVerificationCodeByPhoneNumberAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_check_verification_code_by_phone_number',
	displayName: 'Check Verification Code by Phone Number',
	description: 'Checks a code the user entered against the latest verification for their number.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Checks a code against the pending verification for a phone number and Verify profile. The response_code is accepted or rejected; a wrong code still returns normally, so read response_code. Each check counts as an attempt.',
		idempotent: false,
	},
	props: {
		phoneNumber: Property.ShortText({
			displayName: 'Phone Number',
			description: 'Phone number the code was sent to, in E.164 format.',
			required: true,
		}),
		verifyProfileId: Property.ShortText({
			displayName: 'Verify Profile ID',
			description: 'Verify profile UUID. Use List Verify Profiles to find it.',
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
		return await telnyxApi.checkVerificationCodeByPhoneNumber({
			auth: context.auth,
			phoneNumber: p.phoneNumber,
			body: { code: p.code, verify_profile_id: p.verifyProfileId },
		});
	},
});
