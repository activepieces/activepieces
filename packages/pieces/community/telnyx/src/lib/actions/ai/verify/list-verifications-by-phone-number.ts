import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxListVerificationsByPhoneNumberAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_verifications_by_phone_number',
	displayName: 'List Verifications by Phone Number',
	description: 'Lists the verifications sent to a phone number.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the verifications sent to one phone number, with each id, channel, Verify profile and status. Use it to find a pending verification id for Check Verification Code.',
		idempotent: true,
	},
	props: {
		phoneNumber: Property.ShortText({
			displayName: 'Phone Number',
			description: 'Phone number in E.164 format, e.g. "+13125550002".',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.listVerificationsByPhoneNumber({
			auth: context.auth,
			phoneNumber: context.propsValue.phoneNumber,
		});
	},
});
