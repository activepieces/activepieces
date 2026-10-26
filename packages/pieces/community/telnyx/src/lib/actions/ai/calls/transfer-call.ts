import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxTransferCallAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_transfer_call',
	displayName: 'Transfer Call',
	description: 'Transfers an active call to another number or SIP URI.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Transfers an answered call to a new destination: Telnyx dials the destination and bridges the caller to it when answered. Not idempotent: each call starts a new outbound leg.',
		idempotent: false,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({ required: true }),
		to: Property.ShortText({
			displayName: 'To',
			description: 'Destination phone number (E.164) or SIP URI.',
			required: true,
		}),
		from: Property.ShortText({
			displayName: 'From',
			description: 'Optional caller ID for the new leg; defaults to the original caller.',
			required: false,
		}),
		fromDisplayName: Property.ShortText({
			displayName: 'From Display Name',
			description: 'Optional caller name shown on SIP destinations.',
			required: false,
		}),
		audioUrl: Property.ShortText({
			displayName: 'Audio URL',
			description: 'Optional audio URL played to the destination when it answers.',
			required: false,
		}),
		timeoutSecs: Property.Number({
			displayName: 'Ring Timeout (seconds)',
			description: 'Seconds to ring the destination (5-600). Defaults to 30.',
			required: false,
		}),
		timeLimitSecs: Property.Number({
			displayName: 'Time Limit (seconds)',
			description: 'Maximum length of the new leg in seconds. Defaults to 14400.',
			required: false,
		}),
		earlyMedia: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Early Media',
			description: 'Whether the caller hears the destination ringing. Defaults to Yes.',
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
		targetLegClientState: Property.ShortText({
			displayName: 'Target Leg Client State',
			description: "Optional base64 client state for the new leg's webhooks.",
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
			command: 'transfer',
			body: telnyxUtils.compact({
				values: {
					to: p.to,
					from: p.from,
					from_display_name: p.fromDisplayName,
					audio_url: p.audioUrl,
					timeout_secs: p.timeoutSecs,
					time_limit_secs: p.timeLimitSecs,
					early_media: p.earlyMedia,
					answering_machine_detection: p.answeringMachineDetection,
					webhook_url: p.webhookUrl,
					target_leg_client_state: p.targetLegClientState,
					client_state: p.clientState,
					command_id: p.commandId,
				},
			}),
		});
	},
});
