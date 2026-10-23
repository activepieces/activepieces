import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxDeleteVerifiedNumberAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_delete_verified_number',
	displayName: 'Delete Verified Number',
	description: 'Removes a caller-ID verified number.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Removes a verified external number, so it can no longer be used as caller ID until verified again. Returns the removed number.',
		idempotent: false,
	},
	props: {
		phoneNumber: Property.ShortText({
			displayName: 'Phone Number',
			description: 'Verified phone number in E.164 format. Use List Verified Numbers to find it.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.deleteVerifiedNumber({
			auth: context.auth,
			phoneNumber: context.propsValue.phoneNumber,
		});
	},
});
