import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { listActivityTypesActionOutputSchema } from '../output-schemas';

export const listActivityTypesAction = createAction({
	auth: pipedriveAuth,
	name: 'list-activity-types',
	outputSchema: listActivityTypesActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Activity Types',
	description: 'Lists the activity types of the company.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists every activity type (call, meeting, task, custom types) with its name and key_string. The key_string is the type value that Create Activity and Update Activity expect. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const response = await pipedriveAtomic.call<PipedriveEnvelope<Record<string, unknown>[] | null>>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: '/v1/activityTypes',
			resourceLabel: 'activity types',
		});
		const data = response.data ?? [];
		return { found: data.length > 0, data };
	},
});
