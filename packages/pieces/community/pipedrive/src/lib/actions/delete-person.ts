import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { deleteRecordActionOutputSchema } from '../output-schemas';

export const deletePersonAction = createAction({
	auth: pipedriveAuth,
	name: 'delete-person',
	outputSchema: deleteRecordActionOutputSchema,
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Person',
	description: 'Deletes a person.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Deletes one person (contact) by numeric ID. The person is soft-deleted; Pipedrive purges it after 30 days and it cannot be restored via this piece. Not safe to retry blindly.',
		idempotent: false,
	},
	props: {
		personId: Property.Number({
			displayName: 'Person ID',
			description: 'The numeric ID of the person to delete (from Search Persons or List Persons).',
			required: true,
		}),
	},
	async run(context) {
		const { personId } = context.propsValue;
		return pipedriveAtomic.call<PipedriveEnvelope<{ id: number }>>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			resourceUri: `/v2/persons/${personId}`,
			resourceLabel: `Person ${personId}`,
		});
	},
});
