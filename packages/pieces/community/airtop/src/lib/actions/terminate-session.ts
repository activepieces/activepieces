import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopAuth } from '../common/auth';
import { airtopApiCall } from '../common/client';
import { sessionId } from '../common/props';

export const terminateSessionAction = createAction({
	name: 'terminate-session',
	classification: 'DESTRUCTIVE',
	auth: airtopAuth,
	displayName: 'Terminate Session',
	description: 'Ends an existing browser session in Airtop.',
	audience: 'both',
	aiMetadata: {
		description: 'Terminates an existing Airtop browser session by its session id, freeing its resources. Use this to clean up when done browsing. Not idempotent in effect since it changes server state, though a missing session is ignored without error.',
		idempotent: false,
	},
	props: {
		sessionId: sessionId,
	},
	async run(context) {
		const { sessionId } = context.propsValue;

				// Validate sessionId and windowId to prevent SSRF (CWE-918).
		const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (!UUID_PATTERN.test(sessionId)) {
			throw new Error('Invalid sessionId: expected a UUID');
		}
		if (!UUID_PATTERN.test(windowId)) {
			throw new Error('Invalid windowId: expected a UUID');
		}

const response = await airtopApiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.DELETE,
			resourceUri: `/sessions/${sessionId}`,
		});

		return {
			message: `Session ${sessionId} terminated successfully (or ignored if not found).`,
			response,
		};
	},
});
