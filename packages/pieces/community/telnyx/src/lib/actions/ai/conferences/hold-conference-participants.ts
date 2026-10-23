import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxHoldConferenceParticipantsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_hold_conference_participants',
	displayName: 'Hold Conference Participants',
	description: 'Puts conference participants on hold.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Puts the given participants (or all if none given) on hold, optionally playing hold audio. Reverse with Unhold Conference Participants.',
		idempotent: true,
	},
	props: {
		conferenceId: Property.ShortText({
			displayName: 'Conference ID',
			description: 'Conference ID, returned by Create Conference or List Conferences.',
			required: true,
		}),
		callControlIds: telnyxAiProps.participantCallControlIds({ required: false }),
		audioUrl: Property.ShortText({
			displayName: 'Audio URL',
			description: 'URL of audio played to the participants on hold.',
			required: false,
		}),
		mediaName: Property.ShortText({
			displayName: 'Media Name',
			description: 'Name of uploaded media played on hold. Ignored if Audio URL is set.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.runConferenceCommand({
			auth: context.auth,
			conferenceId: p.conferenceId,
			command: 'hold',
			body: telnyxUtils.compact({
				values: {
					call_control_ids: p.callControlIds,
					audio_url: p.audioUrl,
					media_name: p.mediaName,
				},
			}),
		});
	},
});
