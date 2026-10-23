import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxDeleteCallControlApplicationAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_delete_call_control_application',
	displayName: 'Delete Call Control Application',
	description: 'Deletes a call control application.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a call control application; numbers assigned to it stop receiving calls through it. Returns the deleted application.',
		idempotent: false,
	},
	props: {
		applicationId: Property.ShortText({
			displayName: 'Application ID',
			description: 'Call control application ID. Use List Call Control Applications to find it.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.deleteCallControlApplication({
			auth: context.auth,
			applicationId: context.propsValue.applicationId,
		});
	},
});
