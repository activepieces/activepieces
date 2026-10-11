import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { mergeDealsActionOutputSchema } from '../output-schemas';

export const mergeDealsAction = createAction({
	auth: pipedriveAuth,
	name: 'merge-deals',
	outputSchema: mergeDealsActionOutputSchema,
	classification: 'DESTRUCTIVE',
	displayName: 'Merge Deals',
	description: 'Merges one deal into another, removing the first.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Merges one deal into another: the deal given as Deal ID To Merge Away is REMOVED, and its data, notes and activities move to the deal given as Surviving Deal ID, which is the only one that still exists afterwards. Irreversible - confirm both IDs with Get Deal before calling, and note the two deals must use the same currency. Not safe to retry.',
		idempotent: false,
	},
	props: {
		dealId: Property.Number({
			displayName: 'Deal ID To Merge Away (this deal is removed)',
			description:
				'The numeric ID of the deal that will be CONSUMED and no longer exist after the merge.',
			required: true,
		}),
		mergeWithId: Property.Number({
			displayName: 'Surviving Deal ID (this deal is kept)',
			description:
				'The numeric ID of the deal that SURVIVES the merge and receives the other deal\'s data.',
			required: true,
		}),
	},
	async run(context) {
		const { dealId, mergeWithId } = context.propsValue;
		if (dealId === mergeWithId) {
			throw new Error('A deal cannot be merged with itself.');
		}
		return pipedriveAtomic.call<PipedriveEnvelope<Record<string, unknown>>>({
			auth: context.auth,
			method: HttpMethod.PUT,
			resourceUri: `/v1/deals/${dealId}/merge`,
			resourceLabel: `Deal ${dealId}`,
			body: { merge_with_id: mergeWithId },
		});
	},
});
