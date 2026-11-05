import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxGetCallControlApplicationAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_call_control_application',
	displayName: 'Get Call Control Application',
	description: 'Gets a call control application.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one call control application by id: name, webhook URLs, active flag, DTMF type and inbound/outbound settings including the outbound voice profile.',
		idempotent: true,
	},
	props: {
		applicationId: Property.ShortText({
			displayName: 'Application ID',
			description: 'Call control application ID. Use List Call Control Applications to find it.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.getCallControlApplication({
			auth: context.auth,
			applicationId: context.propsValue.applicationId,
		});
	},
});
