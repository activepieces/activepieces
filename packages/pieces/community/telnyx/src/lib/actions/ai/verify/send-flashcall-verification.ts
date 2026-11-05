import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxSendFlashcallVerificationAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_send_flashcall_verification',
	displayName: 'Send Flash Call Verification',
	description: 'Verifies a number with a missed call whose caller ID carries the code.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Starts a flash call verification: a missed call to the phone number whose caller ID digits are the code. Needs a Verify profile with Flash Call enabled (may be restricted per account); billed per attempt. Confirm the code with Check Verification Code or Check Verification Code by Phone Number. Not idempotent.',
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
			channel: 'flashcall',
			body: telnyxUtils.compact({
				values: {
					phone_number: p.phoneNumber,
					verify_profile_id: p.verifyProfileId,
					timeout_secs: p.timeoutSecs,
				},
			}),
		});
	},
});
