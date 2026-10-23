import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxDialCallAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_dial_call',
	displayName: 'Dial Call',
	description: 'Places an outbound call from a call control application.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Places an outbound call through a call control application and returns its call_control_id, call_leg_id and call_session_id, which the other call actions take. The application (Connection ID) needs an outbound voice profile to reach phone numbers; use List Call Control Applications and List Outbound Voice Profiles. Call progress arrives by webhook; check it with Get Call Status or List Call Events. Not idempotent: every call dials again.',
		idempotent: false,
	},
	props: {
		connectionId: telnyxAiProps.connectionId({ required: true }),
		to: Property.ShortText({
			displayName: 'To',
			description:
				'Destination phone number (E.164) or SIP URI, e.g. "+13125550002" or "sip:alice@example.com".',
			required: true,
		}),
		from: Property.ShortText({
			displayName: 'From',
			description: 'Caller ID: a Telnyx number in E.164 format.',
			required: true,
		}),
		fromDisplayName: Property.ShortText({
			displayName: 'From Display Name',
			description: 'Optional caller name shown on SIP destinations (up to 128 characters).',
			required: false,
		}),
		audioUrl: Property.ShortText({
			displayName: 'Audio URL',
			description: 'Optional WAV or MP3 URL played as soon as the call is answered.',
			required: false,
		}),
		sendDigitsOnAnswer: Property.ShortText({
			displayName: 'Send Digits On Answer',
			description:
				'Optional DTMF digits sent after answer, e.g. "1234#". Use "w" for a 0.5 s pause.',
			required: false,
		}),
		timeoutSecs: Property.Number({
			displayName: 'Ring Timeout (seconds)',
			description: 'Seconds to ring before giving up (5-600). Defaults to 30.',
			required: false,
		}),
		timeLimitSecs: Property.Number({
			displayName: 'Time Limit (seconds)',
			description: 'Maximum call length in seconds (30-14400). Defaults to 14400.',
			required: false,
		}),
		answeringMachineDetection: Property.StaticDropdown({
			displayName: 'Answering Machine Detection',
			description:
				'Detect whether a human or a machine answered; the result arrives in a call.machine.detection.ended webhook. Defaults to disabled.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'disabled', value: 'disabled' },
					{ label: 'detect', value: 'detect' },
					{ label: 'detect_beep', value: 'detect_beep' },
					{ label: 'detect_words', value: 'detect_words' },
					{ label: 'greeting_end', value: 'greeting_end' },
					{ label: 'premium', value: 'premium' },
				],
			},
		}),
		webhookUrl: Property.ShortText({
			displayName: 'Webhook URL',
			description:
				"Optional URL that receives this call's webhooks instead of the application's default.",
			required: false,
		}),
		record: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Record From Answer',
			description: 'Whether to record the call from the moment it is answered.',
		}),
		recordFormat: Property.StaticDropdown({
			displayName: 'Recording Format',
			description: 'Recording file format when Record From Answer is Yes. Defaults to mp3.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'mp3', value: 'mp3' },
					{ label: 'wav', value: 'wav' },
				],
			},
		}),
		recordChannels: Property.StaticDropdown({
			displayName: 'Recording Channels',
			description:
				'single mixes both legs; dual keeps each leg on its own channel. Defaults to dual.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'single', value: 'single' },
					{ label: 'dual', value: 'dual' },
				],
			},
		}),
		clientState: telnyxAiProps.clientState({ required: false }),
		commandId: telnyxAiProps.commandId({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.createCall({
			auth: context.auth,
			body: telnyxUtils.compact({
				values: {
					connection_id: p.connectionId,
					to: p.to,
					from: p.from,
					from_display_name: p.fromDisplayName,
					audio_url: p.audioUrl,
					send_digits_on_answer: p.sendDigitsOnAnswer,
					timeout_secs: p.timeoutSecs,
					time_limit_secs: p.timeLimitSecs,
					answering_machine_detection: p.answeringMachineDetection,
					webhook_url: p.webhookUrl,
					record: p.record ? 'record-from-answer' : undefined,
					record_format: p.recordFormat,
					record_channels: p.recordChannels,
					client_state: p.clientState,
					command_id: p.commandId,
				},
			}),
		});
	},
});
