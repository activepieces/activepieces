import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxSendCallVerificationAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_send_call_verification',
	displayName: 'Send Call Verification',
	description: 'Reads a one-time verification code to the user in a phone call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Places a voice call that reads a one-time verification code to a phone number, using a Verify profile with Call enabled; billed per attempt. Returns the verification with its id; confirm the code with Check Verification Code or Check Verification Code by Phone Number. Not idempotent: every call places a new call.',
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
			description: 'Optional code to read instead of a generated one.',
			required: false,
		}),
		extension: Property.ShortText({
			displayName: 'Extension',
			description: 'Optional extension to dial after the call connects, e.g. "1www2".',
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
			channel: 'call',
			body: telnyxUtils.compact({
				values: {
					phone_number: p.phoneNumber,
					verify_profile_id: p.verifyProfileId,
					custom_code: p.customCode,
					extension: p.extension,
					timeout_secs: p.timeoutSecs,
				},
			}),
		});
	},
});
