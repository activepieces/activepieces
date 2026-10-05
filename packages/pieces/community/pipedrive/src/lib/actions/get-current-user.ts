import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { getCurrentUserActionOutputSchema } from '../output-schemas';

export const getCurrentUserAction = createAction({
	auth: pipedriveAuth,
	name: 'get-current-user',
	outputSchema: getCurrentUserActionOutputSchema,
	classification: 'READ',
	displayName: 'Get Current User',
	description: 'Retrieves the connected Pipedrive user.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the user this connection acts as, with user ID, email, timezone, default currency and company details. Use it for "me" or "my deals" requests to get your own Owner ID; use List Users for teammates. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		return pipedriveAtomic.call<PipedriveEnvelope<Record<string, unknown>>>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: '/v1/users/me',
			resourceLabel: 'the connected user',
		});
	},
});
