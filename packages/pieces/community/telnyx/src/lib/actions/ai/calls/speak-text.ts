import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxSpeakTextAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_speak_text',
	displayName: 'Speak Text',
	description: 'Reads text aloud on an active call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Converts text (or SSML) to speech and plays it on an answered call. Returns when the command is accepted, not when speech finishes (a call.speak.ended webhook follows). To also collect key presses use Gather Using Speak.',
		idempotent: false,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({ required: true }),
		payload: Property.LongText({
			displayName: 'Text',
			description: 'Text or SSML to speak (up to 3,000 characters).',
			required: true,
		}),
		voice: Property.ShortText({
			displayName: 'Voice',
			description:
				'TTS voice, e.g. "female", "male", "Telnyx.KokoroTTS.af" or "AWS.Polly.Joanna-Neural".',
			required: true,
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
		targetLegs: Property.StaticDropdown({
			displayName: 'Target Legs',
			description: 'Which leg hears the speech on a bridged call. Defaults to self.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'self', value: 'self' },
					{ label: 'opposite', value: 'opposite' },
					{ label: 'both', value: 'both' },
				],
			},
		}),
		stop: Property.StaticDropdown({
			displayName: 'Stop Current Audio',
			description:
				'Stop audio that is already playing: current (the current prompt) or all (all queued prompts).',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'current', value: 'current' },
					{ label: 'all', value: 'all' },
				],
			},
		}),
		clientState: telnyxAiProps.clientState({ required: false }),
		commandId: telnyxAiProps.commandId({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.sendCallCommand({
			auth: context.auth,
			callControlId: p.callControlId,
			command: 'speak',
			body: telnyxUtils.compact({
				values: {
					payload: p.payload,
					voice: p.voice,
					payload_type: p.payloadType,
					language: p.language,
					service_level: p.serviceLevel,
					target_legs: p.targetLegs,
					stop: p.stop,
					client_state: p.clientState,
					command_id: p.commandId,
				},
			}),
		});
	},
});
