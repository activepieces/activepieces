import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { listUsersActionOutputSchema } from '../output-schemas';

export const listUsersAction = createAction({
	auth: pipedriveAuth,
	name: 'list-users',
	outputSchema: listUsersActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Users',
	description: 'Lists the users of the company.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists every user in the Pipedrive company with ID, name, email and active state. Use it to turn a teammate\'s name into the Owner ID or User ID other actions expect; Find User instead looks up one user by name or email, and Get Current User returns the connected user. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const response = await pipedriveAtomic.call<PipedriveEnvelope<Record<string, unknown>[] | null>>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: '/v1/users',
			resourceLabel: 'users',
		});
		const data = response.data ?? [];
		return { found: data.length > 0, data };
	},
});
