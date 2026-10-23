import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxGetConferenceAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_conference',
	displayName: 'Get Conference',
	description: 'Gets a conference.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one conference by id: name, status, region, end reason and timestamps. For its participants use List Conference Participants.',
		idempotent: true,
	},
	props: {
		conferenceId: Property.ShortText({
			displayName: 'Conference ID',
			description: 'Conference ID, returned by Create Conference or List Conferences.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.getConference({
			auth: context.auth,
			conferenceId: context.propsValue.conferenceId,
		});
	},
});
