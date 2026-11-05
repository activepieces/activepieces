import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListConferenceParticipantsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_conference_participants',
	displayName: 'List Conference Participants',
	description: 'Lists the participants of a conference.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of participants in a conference with their participant id, call_control_id, muted and on-hold state. Use the call_control_id values to target participants in Mute, Hold or Play actions.',
		idempotent: true,
	},
	props: {
		conferenceId: Property.ShortText({
			displayName: 'Conference ID',
			description: 'Conference ID, returned by Create Conference or List Conferences.',
			required: true,
		}),
		muted: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Muted',
			description: 'Only return participants who are (Yes) or are not (No) muted.',
		}),
		onHold: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'On Hold',
			description: 'Only return participants who are (Yes) or are not (No) on hold.',
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listConferenceParticipants({
			auth: context.auth,
			conferenceId: p.conferenceId,
			query: {
				...telnyxUtils.filterQuery({ filters: { muted: p.muted, on_hold: p.onHold } }),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
