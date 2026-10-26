import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxSendConferenceDtmfAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_send_conference_dtmf',
	displayName: 'Send Conference DTMF',
	description: 'Sends DTMF tones into a conference.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends DTMF digits (0-9, *, #, A-D, w for a 0.5s pause) to the given participants or the whole conference.',
		idempotent: false,
	},
	props: {
		conferenceId: Property.ShortText({
			displayName: 'Conference ID',
			description: 'Conference ID, returned by Create Conference or List Conferences.',
			required: true,
		}),
		digits: Property.ShortText({
			displayName: 'Digits',
			description: 'DTMF digits to send, e.g. "1234#".',
			required: true,
		}),
		callControlIds: telnyxAiProps.participantCallControlIds({ required: false }),
		durationMillis: Property.Number({
			displayName: 'Duration (ms)',
			description: 'Duration of each digit in milliseconds (100-500). Defaults to 250.',
			required: false,
		}),
		clientState: telnyxAiProps.clientState({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.runConferenceCommand({
			auth: context.auth,
			conferenceId: p.conferenceId,
			command: 'send_dtmf',
			body: telnyxUtils.compact({
				values: {
					digits: p.digits,
					call_control_ids: p.callControlIds,
					duration_millis: p.durationMillis,
					client_state: p.clientState,
				},
			}),
		});
	},
});
