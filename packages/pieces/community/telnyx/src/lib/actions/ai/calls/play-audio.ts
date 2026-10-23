import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxPlayAudioAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_play_audio',
	displayName: 'Play Audio',
	description: 'Plays an audio file on an active call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Plays a WAV/MP3 file from a URL, or a file uploaded with Upload Media, on an answered call. Set exactly one of Audio URL or Media Name. Returns when the command is accepted; a call.playback.ended webhook follows. Stop it with Stop Audio.',
		idempotent: false,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({ required: true }),
		audioUrl: Property.ShortText({
			displayName: 'Audio URL',
			description: 'Public WAV or MP3 URL to play.',
			required: false,
		}),
		mediaName: Property.ShortText({
			displayName: 'Media Name',
			description: 'Name of a file uploaded with Upload Media, instead of Audio URL.',
			required: false,
		}),
		loop: Property.Number({
			displayName: 'Loop Count',
			description: 'How many times to play the file. Defaults to 1.',
			required: false,
		}),
		overlay: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Overlay',
			description: 'Whether to play on top of other audio already playing. Defaults to No.',
		}),
		targetLegs: Property.StaticDropdown({
			displayName: 'Target Legs',
			description: 'Which leg hears the audio on a bridged call. Defaults to self.',
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
		audioType: Property.StaticDropdown({
			displayName: 'Audio Type',
			description: 'File format of the audio. Defaults to mp3.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'mp3', value: 'mp3' },
					{ label: 'wav', value: 'wav' },
				],
			},
		}),
		cacheAudio: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Cache Audio',
			description: 'Whether Telnyx caches the file for later plays. Defaults to Yes.',
		}),
		clientState: telnyxAiProps.clientState({ required: false }),
		commandId: telnyxAiProps.commandId({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.sendCallCommand({
			auth: context.auth,
			callControlId: p.callControlId,
			command: 'playback_start',
			body: telnyxUtils.compact({
				values: {
					audio_url: p.audioUrl,
					media_name: p.mediaName,
					loop: p.loop,
					overlay: p.overlay,
					target_legs: p.targetLegs,
					audio_type: p.audioType,
					cache_audio: p.cacheAudio,
					client_state: p.clientState,
					command_id: p.commandId,
				},
			}),
		});
	},
});
