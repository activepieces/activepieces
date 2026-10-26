import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxGatherUsingSpeakAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_gather_using_speak',
	displayName: 'Gather Using Speak',
	description: 'Speaks a prompt and collects key presses.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Speaks a text prompt on an answered call and collects the caller's DTMF key presses, replaying an invalid-input prompt up to Maximum Tries. The collected digits are not returned here: they arrive in a call.gather.ended webhook, which you can read afterwards with List Call Events (filter by the call leg).",
		idempotent: false,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({ required: true }),
		payload: Property.LongText({
			displayName: 'Prompt Text',
			description: 'Text or SSML prompt to speak.',
			required: true,
		}),
		voice: Property.ShortText({
			displayName: 'Voice',
			description:
				'TTS voice, e.g. "female", "male", "Telnyx.KokoroTTS.af" or "AWS.Polly.Joanna-Neural".',
			required: true,
		}),
		invalidPayload: Property.LongText({
			displayName: 'Invalid Input Text',
			description: 'Optional text spoken when the input is invalid.',
			required: false,
		}),
		payloadType: Property.StaticDropdown({
			displayName: 'Payload Type',
			description: 'Whether the payload is plain text or SSML. Defaults to text.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'text', value: 'text' },
					{ label: 'ssml', value: 'ssml' },
				],
			},
		}),
		language: Property.ShortText({
			displayName: 'Language',
			description: 'Language code for basic voices, e.g. "en-US". Defaults to en-US.',
			required: false,
		}),
		serviceLevel: Property.StaticDropdown({
			displayName: 'Service Level',
			description: 'basic (female/male voices) or premium. Defaults to premium.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'basic', value: 'basic' },
					{ label: 'premium', value: 'premium' },
				],
			},
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
			command: 'gather_using_speak',
			body: telnyxUtils.compact({
				values: {
					payload: p.payload,
					voice: p.voice,
					invalid_payload: p.invalidPayload,
					payload_type: p.payloadType,
					language: p.language,
					service_level: p.serviceLevel,
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
