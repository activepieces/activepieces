import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxSendSmsVerificationAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_send_sms_verification',
	displayName: 'Send SMS Verification',
	description: 'Sends a one-time verification code by SMS.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends a one-time verification code by SMS to a phone number using a Verify profile with SMS enabled; billed per attempt. Returns the verification with its id; confirm the code the user received with Check Verification Code (by id) or Check Verification Code by Phone Number. Not idempotent: every call sends a new code.',
		idempotent: false,
	},
	props: {
		phoneNumber: Property.ShortText({
			displayName: 'Phone Number',
			description: 'Phone number to verify in E.164 format, e.g. "+13125550002".',
			required: true,
		}),
		verifyProfileId: Property.ShortText({
			displayName: 'Verify Profile ID',
			description:
				'Verify profile UUID with this channel enabled. Use List Verify Profiles to find it.',
			required: true,
		}),
		customCode: Property.ShortText({
			displayName: 'Custom Code',
			description: 'Optional code to send instead of a generated one.',
			required: false,
		}),
		timeoutSecs: Property.Number({
			displayName: 'Timeout (seconds)',
			description: 'How long the code stays valid. Defaults to the profile setting.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.sendVerification({
			auth: context.auth,
			channel: 'sms',
			body: telnyxUtils.compact({
				values: {
					phone_number: p.phoneNumber,
					verify_profile_id: p.verifyProfileId,
					custom_code: p.customCode,
					timeout_secs: p.timeoutSecs,
				},
			}),
		});
	},
});
