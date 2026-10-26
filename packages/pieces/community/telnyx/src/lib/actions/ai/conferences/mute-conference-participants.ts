import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxMuteConferenceParticipantsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_mute_conference_participants',
	displayName: 'Mute Conference Participants',
	description: 'Mutes conference participants.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Mutes the given participants, or every participant if none are given. Reverse with Unmute Conference Participants.',
		idempotent: true,
	},
	props: {
		conferenceId: Property.ShortText({
			displayName: 'Conference ID',
			description: 'Conference ID, returned by Create Conference or List Conferences.',
			required: true,
		}),
		callControlIds: telnyxAiProps.participantCallControlIds({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.runConferenceCommand({
			auth: context.auth,
			conferenceId: p.conferenceId,
			command: 'mute',
			body: telnyxUtils.compact({
				values: {
					call_control_ids: p.callControlIds,
				},
			}),
		});
	},
});
