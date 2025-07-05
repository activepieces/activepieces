import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopAuth } from '../common/auth';
import { airtopApiCall } from '../common/client';
import { sessionId } from '../common/props';

export const terminateSessionAction = createAction({
	name: 'terminate-session',
	auth: airtopAuth,
	displayName: 'Terminate Session',
	description: 'Ends an existing browser session in Airtop.',
	props: {
		sessionId: sessionId,
	},
	async run(context) {
		const { sessionId } = context.propsValue;

		const response = await airtopApiCall({
			apiKey: context.auth,
			method: HttpMethod.DELETE,
			resourceUri: `/sessions/${sessionId}`,
		});

		return {
			message: `Session ${sessionId} terminated successfully (or ignored if not found).`,
			response,
		};
	},
});
