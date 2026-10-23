import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxSendDtmfAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_send_dtmf',
	displayName: 'Send DTMF',
	description: 'Sends key presses on an active call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends DTMF tones on an answered call, e.g. to navigate a phone menu. Digits 0-9, *, #, A-D; "w" adds a 0.5 s pause and "W" a 1 s pause.',
		idempotent: false,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({ required: true }),
		digits: Property.ShortText({
			displayName: 'Digits',
			description: 'Digits to send, e.g. "1www2#".',
			required: true,
		}),
		durationMillis: Property.Number({
			displayName: 'Tone Duration (ms)',
			description: 'Length of each tone in milliseconds (100-500). Defaults to 250.',
			required: false,
		}),
		clientState: telnyxAiProps.clientState({ required: false }),
		commandId: telnyxAiProps.commandId({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.sendCallCommand({
			auth: context.auth,
			callControlId: p.callControlId,
			command: 'send_dtmf',
			body: telnyxUtils.compact({
				values: {
					digits: p.digits,
					duration_millis: p.durationMillis,
					client_state: p.clientState,
					command_id: p.commandId,
				},
			}),
		});
	},
});
