import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxRequestNumberVerificationAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_request_number_verification',
	displayName: 'Request Number Verification',
	description: 'Sends a code to an external number so it can be used as caller ID.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Starts caller-ID verification of an external phone number by sending it a code by SMS or call. Then pass the received code to Submit Number Verification Code. Not idempotent: every call sends a new code.',
		idempotent: false,
	},
	props: {
		phoneNumber: Property.ShortText({
			displayName: 'Phone Number',
			description: 'External phone number in E.164 format, e.g. "+13125550002".',
			required: true,
		}),
		verificationMethod: Property.StaticDropdown({
			displayName: 'Verification Method',
			description: 'How to deliver the code.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'SMS', value: 'sms' },
					{ label: 'Call', value: 'call' },
				],
			},
		}),
		extension: Property.ShortText({
			displayName: 'Extension',
			description: 'Optional extension to dial for call verification, e.g. "1www2".',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.requestNumberVerification({
			auth: context.auth,
			body: telnyxUtils.compact({
				values: {
					phone_number: p.phoneNumber,
					verification_method: p.verificationMethod,
					extension: p.extension,
				},
			}),
		});
	},
});
