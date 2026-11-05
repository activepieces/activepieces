import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxPlayConferenceAudioAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_play_conference_audio',
	displayName: 'Play Conference Audio',
	description: 'Plays an audio file into a conference.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Plays an audio file (URL or uploaded media name) to the given participants, or to the whole conference. Stop it with Stop Conference Audio.',
		idempotent: false,
	},
	props: {
		conferenceId: Property.ShortText({
			displayName: 'Conference ID',
			description: 'Conference ID, returned by Create Conference or List Conferences.',
			required: true,
		}),
		audioUrl: Property.ShortText({
			displayName: 'Audio URL',
			description: 'URL of a WAV or MP3 file to play. Set this or Media Name.',
			required: false,
		}),
		mediaName: Property.ShortText({
			displayName: 'Media Name',
			description: 'Name of uploaded media to play (from Upload Media). Set this or Audio URL.',
			required: false,
		}),
		loop: Property.ShortText({
			displayName: 'Loop',
			description: 'Number of times to play the audio, or "infinity". Defaults to 1.',
			required: false,
		}),
		callControlIds: telnyxAiProps.participantCallControlIds({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.runConferenceCommand({
			auth: context.auth,
			conferenceId: p.conferenceId,
			command: 'play',
			body: telnyxUtils.compact({
				values: {
					audio_url: p.audioUrl,
					media_name: p.mediaName,
					loop: p.loop === undefined || p.loop === 'infinity' ? p.loop : Number(p.loop),
					call_control_ids: p.callControlIds,
				},
			}),
		});
	},
});
