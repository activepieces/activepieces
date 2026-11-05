import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';

export const telnyxGetCallStatusAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_call_status',
	displayName: 'Get Call Status',
	description: 'Gets whether a call is still active and how long it has run.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the live status of a call by its call_control_id: whether it is still alive, its duration, start/end time and client state. Use it after Dial Call or before sending a command to a call. Telnyx forgets ended calls after a short while, so an old id may return not found.',
		idempotent: true,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({ required: true }),
	},
	async run(context) {
		return await telnyxApi.getCallStatus({
			auth: context.auth,
			callControlId: context.propsValue.callControlId,
		});
	},
});
