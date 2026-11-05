import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxUnholdConferenceParticipantsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_unhold_conference_participants',
	displayName: 'Unhold Conference Participants',
	description: 'Takes conference participants off hold.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Takes the given participants off hold so they hear and are heard in the conference again.',
		idempotent: true,
	},
	props: {
		conferenceId: Property.ShortText({
			displayName: 'Conference ID',
			description: 'Conference ID, returned by Create Conference or List Conferences.',
			required: true,
		}),
		callControlIds: telnyxAiProps.participantCallControlIds({
			required: true,
			description: 'Call control IDs of the participants to take off hold.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.runConferenceCommand({
			auth: context.auth,
			conferenceId: p.conferenceId,
			command: 'unhold',
			body: telnyxUtils.compact({
				values: {
					call_control_ids: p.callControlIds,
				},
			}),
		});
	},
});
