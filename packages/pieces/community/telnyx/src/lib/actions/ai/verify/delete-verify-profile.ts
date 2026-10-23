import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxDeleteVerifyProfileAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_delete_verify_profile',
	displayName: 'Delete Verify Profile',
	description: 'Deletes a Verify profile.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a Verify profile; verifications can no longer be sent with it. Returns the deleted profile. Use List Verify Profiles to find the id.',
		idempotent: false,
	},
	props: {
		verifyProfileId: Property.ShortText({
			displayName: 'Verify Profile ID',
			description: 'Verify profile UUID. Use List Verify Profiles to find it.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.deleteVerifyProfile({
			auth: context.auth,
			verifyProfileId: context.propsValue.verifyProfileId,
		});
	},
});
