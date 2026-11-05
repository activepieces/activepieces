import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxSpeakToConferenceAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_speak_to_conference',
	displayName: 'Speak To Conference',
	description: 'Speaks text into a conference using text-to-speech.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Converts text (or SSML) to speech and plays it to the given participants or the whole conference. Voice is e.g. "female", "male" or a provider voice like "Polly.Joanna". Not idempotent: each call speaks again.',
		idempotent: false,
	},
	props: {
		conferenceId: Property.ShortText({
			displayName: 'Conference ID',
			description: 'Conference ID, returned by Create Conference or List Conferences.',
			required: true,
		}),
		payload: Property.ShortText({
			displayName: 'Text',
			description: 'Text or SSML to speak.',
			required: true,
		}),
		voice: Property.ShortText({
			displayName: 'Voice',
			description: 'Voice to use, e.g. "female", "male", "Polly.Joanna" or "Telnyx.KokoroTTS.af".',
			required: true,
		}),
		payloadType: Property.StaticDropdown({
			displayName: 'Payload Type',
			description: 'Whether Text is plain text or SSML. Defaults to text.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Text', value: 'text' },
					{ label: 'SSML', value: 'ssml' },
				],
			},
		}),
		language: Property.ShortText({
			displayName: 'Language',
			description: 'Language code for basic voices, e.g. "en-US". Defaults to en-US.',
			required: false,
		}),
		callControlIds: telnyxAiProps.participantCallControlIds({ required: false }),
		commandId: telnyxAiProps.commandId({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.runConferenceCommand({
			auth: context.auth,
			conferenceId: p.conferenceId,
			command: 'speak',
			body: telnyxUtils.compact({
				values: {
					payload: p.payload,
					voice: p.voice,
					payload_type: p.payloadType,
					language: p.language,
					call_control_ids: p.callControlIds,
					command_id: p.commandId,
				},
			}),
		});
	},
});
