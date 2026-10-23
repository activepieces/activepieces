import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxStopConferenceAudioAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_stop_conference_audio',
	displayName: 'Stop Conference Audio',
	description: 'Stops audio playing in a conference.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Stops audio started by Play Conference Audio or Speak To Conference, for the given participants or the whole conference.',
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
			command: 'stop',
			body: telnyxUtils.compact({
				values: {
					call_control_ids: p.callControlIds,
				},
			}),
		});
	},
});
