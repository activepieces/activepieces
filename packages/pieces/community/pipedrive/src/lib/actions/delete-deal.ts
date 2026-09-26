import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { deleteRecordActionOutputSchema } from '../output-schemas';

export const deleteDealAction = createAction({
	auth: pipedriveAuth,
	name: 'delete-deal',
	outputSchema: deleteRecordActionOutputSchema,
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Deal',
	description: 'Deletes a deal.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Deletes one deal by its numeric ID. The deal is soft-deleted; Pipedrive purges it after 30 days and it cannot be restored via this piece. To close a deal as won or lost instead, use Update Deal. Not safe to retry blindly.',
		idempotent: false,
	},
	props: {
		dealId: Property.Number({
			displayName: 'Deal ID',
			description: 'The numeric ID of the deal to delete (from Search Deals or List Deals).',
			required: true,
		}),
	},
	async run(context) {
		const { dealId } = context.propsValue;
		return pipedriveAtomic.call<PipedriveEnvelope<{ id: number }>>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			resourceUri: `/v2/deals/${dealId}`,
			resourceLabel: `Deal ${dealId}`,
		});
	},
});
