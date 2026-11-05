import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxGetConferenceParticipantAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_conference_participant',
	displayName: 'Get Conference Participant',
	description: 'Gets one participant of a conference.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one conference participant by id: call_control_id, status, muted and on-hold state, and end-on-exit settings.',
		idempotent: true,
	},
	props: {
		conferenceId: Property.ShortText({
			displayName: 'Conference ID',
			description: 'Conference ID, returned by Create Conference or List Conferences.',
			required: true,
		}),
		participantId: Property.ShortText({
			displayName: 'Participant ID',
			description: 'Participant ID or call_control_id, from List Conference Participants.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.getConferenceParticipant({
			auth: context.auth,
			conferenceId: p.conferenceId,
			participantId: p.participantId,
		});
	},
});
