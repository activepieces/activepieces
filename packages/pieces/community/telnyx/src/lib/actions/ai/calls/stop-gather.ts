import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxStopGatherAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_stop_gather',
	displayName: 'Stop Gather',
	description: 'Stops collecting key presses on a call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Stops a running gather started by Gather DTMF, Gather Using Speak or Gather Using Audio. Digits collected so far arrive in the call.gather.ended webhook (see List Call Events).',
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
			command: 'gather_stop',
			body: telnyxUtils.compact({
				values: {
					client_state: p.clientState,
					command_id: p.commandId,
				},
			}),
		});
	},
});
