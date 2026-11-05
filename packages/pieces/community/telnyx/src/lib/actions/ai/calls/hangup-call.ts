import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxHangupCallAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_hangup_call',
	displayName: 'Hang Up Call',
	description: 'Ends an active call.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Hangs up an active call leg by its call_control_id. Cannot be undone; the call ends for this leg.',
		idempotent: false,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({ required: true }),
		clientState: telnyxAiProps.clientState({ required: false }),
		commandId: telnyxAiProps.commandId({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.sendCallCommand({
			auth: context.auth,
			callControlId: p.callControlId,
			command: 'hangup',
			body: telnyxUtils.compact({
				values: {
					client_state: p.clientState,
					command_id: p.commandId,
				},
			}),
		});
	},
});
