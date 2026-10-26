import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxStopCallTranscriptionAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_stop_call_transcription',
	displayName: 'Stop Call Transcription',
	description: 'Stops real-time transcription of an active call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Stops live transcription started with Start Call Transcription.',
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
			command: 'transcription_stop',
			body: telnyxUtils.compact({
				values: {
					client_state: p.clientState,
					command_id: p.commandId,
				},
			}),
		});
	},
});
