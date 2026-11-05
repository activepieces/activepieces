import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxUnmuteConferenceParticipantsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_unmute_conference_participants',
	displayName: 'Unmute Conference Participants',
	description: 'Unmutes conference participants.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Unmutes the given participants, or every participant if none are given.',
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
			command: 'unmute',
			body: telnyxUtils.compact({
				values: {
					call_control_ids: p.callControlIds,
				},
			}),
		});
	},
});
