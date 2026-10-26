import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { mergePersonsActionOutputSchema } from '../output-schemas';

export const mergePersonsAction = createAction({
	auth: pipedriveAuth,
	name: 'merge-persons',
	outputSchema: mergePersonsActionOutputSchema,
	classification: 'DESTRUCTIVE',
	displayName: 'Merge Persons',
	description: 'Merges one person into another, removing the first.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Merges one person into another: the person given as Person ID To Merge Away is REMOVED, and their deals, notes and activities move to the person given as Surviving Person ID, whose own field values are not overwritten on conflict. Irreversible - confirm both IDs with Get Person first. Not safe to retry.',
		idempotent: false,
	},
	props: {
		personId: Property.Number({
			displayName: 'Person ID To Merge Away (this person is removed)',
			description:
				'The numeric ID of the person that will be CONSUMED and no longer exist after the merge.',
			required: true,
		}),
		mergeWithId: Property.Number({
			displayName: 'Surviving Person ID (this person is kept)',
			description:
				'The numeric ID of the person that SURVIVES the merge and will NOT be overwritten.',
			required: true,
		}),
	},
	async run(context) {
		const { personId, mergeWithId } = context.propsValue;
		if (personId === mergeWithId) {
			throw new Error('A person cannot be merged with themselves.');
		}
		return pipedriveAtomic.call<PipedriveEnvelope<Record<string, unknown>>>({
			auth: context.auth,
			method: HttpMethod.PUT,
			resourceUri: `/v1/persons/${personId}/merge`,
			resourceLabel: `Person ${personId}`,
			body: { merge_with_id: mergeWithId },
		});
	},
});
