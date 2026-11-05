import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxGetVerifiedNumberAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_verified_number',
	displayName: 'Get Verified Number',
	description: 'Gets a caller-ID verified number.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one verified external phone number and when it was verified. Fails with 404 when the number has not been verified.',
		idempotent: true,
	},
	props: {
		phoneNumber: Property.ShortText({
			displayName: 'Phone Number',
			description: 'Verified phone number in E.164 format. Use List Verified Numbers to find it.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.getVerifiedNumber({
			auth: context.auth,
			phoneNumber: context.propsValue.phoneNumber,
		});
	},
});
