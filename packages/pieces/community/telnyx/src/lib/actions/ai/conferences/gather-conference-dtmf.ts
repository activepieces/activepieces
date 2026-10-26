import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxGatherConferenceDtmfAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_gather_conference_dtmf',
	displayName: 'Gather Conference DTMF',
	description: 'Plays an audio prompt to a participant and collects DTMF digits.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Plays an audio prompt to one conference participant and collects the digits they press. The digits are not returned here: they arrive as a call.gather.ended webhook event, which List Call Events can show.',
		idempotent: false,
	},
	props: {
		conferenceId: Property.ShortText({
			displayName: 'Conference ID',
			description: 'Conference ID, returned by Create Conference or List Conferences.',
			required: true,
		}),
		callControlId: telnyxAiProps.callControlId({ required: true }),
		audioUrl: Property.ShortText({
			displayName: 'Audio URL',
			description: 'URL of the prompt audio. Set this or Media Name.',
			required: false,
		}),
		mediaName: Property.ShortText({
			displayName: 'Media Name',
			description: 'Name of uploaded prompt media. Set this or Audio URL.',
			required: false,
		}),
		minimumDigits: Property.Number({
			displayName: 'Minimum Digits',
			description: 'Minimum number of digits to collect. Defaults to 1.',
			required: false,
		}),
		maximumDigits: Property.Number({
			displayName: 'Maximum Digits',
			description: 'Maximum number of digits to collect. Defaults to 128.',
			required: false,
		}),
		maximumTries: Property.Number({
			displayName: 'Maximum Tries',
			description: 'How many times to play the prompt if input is invalid. Defaults to 3.',
			required: false,
		}),
		timeoutMillis: Property.Number({
			displayName: 'Timeout (ms)',
			description: 'Total time to wait for input in milliseconds. Defaults to 60000.',
			required: false,
		}),
		terminatingDigit: Property.ShortText({
			displayName: 'Terminating Digit',
			description: 'Digit that ends input. Defaults to #.',
			required: false,
		}),
		validDigits: Property.ShortText({
			displayName: 'Valid Digits',
			description: 'Digits accepted as input. Defaults to 0123456789#*.',
			required: false,
		}),
		invalidAudioUrl: Property.ShortText({
			displayName: 'Invalid Audio URL',
			description: 'URL of audio played after invalid input.',
			required: false,
		}),
		clientState: telnyxAiProps.clientState({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.runConferenceCommand({
			auth: context.auth,
			conferenceId: p.conferenceId,
			command: 'gather_using_audio',
			body: telnyxUtils.compact({
				values: {
					call_control_id: p.callControlId,
					audio_url: p.audioUrl,
					media_name: p.mediaName,
					minimum_digits: p.minimumDigits,
					maximum_digits: p.maximumDigits,
					maximum_tries: p.maximumTries,
					timeout_millis: p.timeoutMillis,
					terminating_digit: p.terminatingDigit,
					valid_digits: p.validDigits,
					invalid_audio_url: p.invalidAudioUrl,
					client_state: p.clientState,
				},
			}),
		});
	},
});
