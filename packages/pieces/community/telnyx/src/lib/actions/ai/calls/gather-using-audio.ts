import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxGatherUsingAudioAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_gather_using_audio',
	displayName: 'Gather Using Audio',
	description: 'Plays an audio prompt and collects key presses.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Plays an audio prompt (URL or uploaded media) on an answered call and collects the caller's DTMF key presses. Set Audio URL or Media Name. The collected digits are not returned here: they arrive in a call.gather.ended webhook, which you can read afterwards with List Call Events (filter by the call leg).",
		idempotent: false,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({ required: true }),
		audioUrl: Property.ShortText({
			displayName: 'Audio URL',
			description: 'Public WAV or MP3 URL of the prompt.',
			required: false,
		}),
		mediaName: Property.ShortText({
			displayName: 'Media Name',
			description: 'Name of a file uploaded with Upload Media, instead of Audio URL.',
			required: false,
		}),
		invalidAudioUrl: Property.ShortText({
			displayName: 'Invalid Input Audio URL',
			description: 'Optional audio URL played when the input is invalid.',
			required: false,
		}),
		invalidMediaName: Property.ShortText({
			displayName: 'Invalid Input Media Name',
			description: 'Optional uploaded media played when the input is invalid.',
			required: false,
		}),
		minimumDigits: Property.Number({
			displayName: 'Minimum Digits',
			description: 'Fewest digits to gather. Defaults to 1.',
			required: false,
		}),
		maximumDigits: Property.Number({
			displayName: 'Maximum Digits',
			description: 'Most digits to gather (up to 128). Defaults to 128.',
			required: false,
		}),
		timeoutMillis: Property.Number({
			displayName: 'Timeout (ms)',
			description: 'Milliseconds to wait for the full input. Defaults to 60000.',
			required: false,
		}),
		interDigitTimeoutMillis: Property.Number({
			displayName: 'Inter-Digit Timeout (ms)',
			description: 'Milliseconds to wait between digits. Defaults to 5000.',
			required: false,
		}),
		terminatingDigit: Property.ShortText({
			displayName: 'Terminating Digit',
			description: 'Digit that ends input, e.g. "#". Defaults to #.',
			required: false,
		}),
		validDigits: Property.ShortText({
			displayName: 'Valid Digits',
			description:
				'Digits to accept, e.g. "0123456789". Others are ignored. Defaults to 0123456789#*.',
			required: false,
		}),
		maximumTries: Property.Number({
			displayName: 'Maximum Tries',
			description: 'How many times to replay the prompt when input is invalid. Defaults to 3.',
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
			command: 'gather_using_audio',
			body: telnyxUtils.compact({
				values: {
					audio_url: p.audioUrl,
					media_name: p.mediaName,
					invalid_audio_url: p.invalidAudioUrl,
					invalid_media_name: p.invalidMediaName,
					minimum_digits: p.minimumDigits,
					maximum_digits: p.maximumDigits,
					timeout_millis: p.timeoutMillis,
					inter_digit_timeout_millis: p.interDigitTimeoutMillis,
					terminating_digit: p.terminatingDigit,
					valid_digits: p.validDigits,
					maximum_tries: p.maximumTries,
					client_state: p.clientState,
					command_id: p.commandId,
				},
			}),
		});
	},
});
