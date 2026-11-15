import { createAction, Property } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { codaApi } from '../common/client';
import { getMutationStatusActionOutputSchema } from '../output-schemas';

export const getMutationStatusAction = createAction({
	auth: codaAuth,
	name: 'get_mutation_status',
	classification: 'READ',
	displayName: 'Get Mutation Status',
	description: 'Checks whether an earlier change (by its Request ID) has been applied by Coda.',
	audience: 'both',
	aiMetadata: {
		description: 'Checks whether an earlier Coda write, identified by the Request ID it returned, has been applied, and returns any warning. Use when a write returned Completed = false. Coda keeps statuses for about a day. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		requestId: Property.ShortText({
			displayName: 'Request ID',
			description: 'The Request ID returned by a previous Coda step.',
			required: true,
		}),
	},
	outputSchema: getMutationStatusActionOutputSchema,
	async run(context) {
		const requestId = context.propsValue.requestId.trim();
		const status = await codaApi.getMutationStatus({ token: context.auth.secret_text, requestId });
		return { requestId, completed: status.completed, warning: status.warning ?? null };
	},
});
