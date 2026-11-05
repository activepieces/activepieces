import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';

export const telnyxUpdateCallClientStateAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_update_call_client_state',
	displayName: 'Update Call Client State',
	description: 'Replaces the client state attached to a call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Replaces the client state stored on an active call; every later webhook for the call carries the new value. Setting the same value again changes nothing.',
		idempotent: true,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({ required: true }),
		clientState: telnyxAiProps.clientState({
			required: true,
			description: "New base64-encoded client state echoed in the call's later webhooks.",
		}),
	},
	async run(context) {
		return await telnyxApi.updateCallClientState({
			auth: context.auth,
			callControlId: context.propsValue.callControlId,
			clientState: context.propsValue.clientState,
		});
	},
});
